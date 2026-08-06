import prisma from '../../config/prisma'
import { HttpError } from '../../middeware/httpError'
import { createAuditLog } from '../../config/auditLog'
import {
  registrarMovimientoFondo,
  actualizarMovimientoCajaVinculado,
  anularMovimientoCajaVinculado,
} from '../caja/movimientoHelper'

const ESTADOS_APORTE = ['ACTIVO', 'ANULADO']
const TIPOS_APORTE = ['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA']

function parseFechaLocal(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new HttpError(400, 'Fecha inválida (formato YYYY-MM-DD)')
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

function claveUnicaAporte(fondoSocioId: number, tipo: string, periodo: string): string | null {
  if (tipo !== 'OBLIGATORIO') return null
  return `FS${fondoSocioId}-OBL-${periodo}`
}

export const aporteService = {
  async list(params: {
    search?: string
    page?: number
    limit?: number
    estado?: string
    fondoId?: number
    socioId?: number
    tipo?: string
    periodo?: string
  }) {
    const { search, page = 1, limit = 10, estado, fondoId, socioId, tipo, periodo } = params
    if (page < 1 || limit < 1) {
      throw new HttpError(400, 'Parámetros de paginación inválidos')
    }
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) {
      if (!ESTADOS_APORTE.includes(estado)) {
        throw new HttpError(400, 'Estado inválido. Debe ser ACTIVO o ANULADO')
      }
      where.estado = estado
    }
    if (tipo) {
      if (!TIPOS_APORTE.includes(tipo)) {
        throw new HttpError(400, 'Tipo de aporte inválido')
      }
      where.tipo = tipo
    }
    if (periodo) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
        throw new HttpError(400, 'Período inválido (formato YYYY-MM)')
      }
      where.periodo = periodo
    }

    const fondoSocioWhere: any = {}
    if (fondoId) fondoSocioWhere.fondoId = fondoId
    if (socioId) fondoSocioWhere.socioId = socioId
    if (Object.keys(fondoSocioWhere).length > 0) where.fondoSocio = fondoSocioWhere

    if (search) {
      const terms = search.split(/\s+/).filter(Boolean)
      where.AND = terms.map((term) => ({
        OR: [
          { comprobante: { contains: term } },
          { periodo: { contains: term } },
          { fondoSocio: { socio: { nombres: { contains: term } } } },
          { fondoSocio: { socio: { apellidoPaterno: { contains: term } } } },
          { fondoSocio: { socio: { apellidoMaterno: { contains: term } } } },
        ],
      }))
    }

    const activoWhere: any = { ...where }
    delete activoWhere.estado
    activoWhere.estado = 'ACTIVO'

    // Suma por moneda respetando todos los filtros (estado por defecto ACTIVO).
    const condMoneda: string[] = []
    const paramsMoneda: any[] = []
    if (estado) { condMoneda.push('a.estado = ?'); paramsMoneda.push(estado) }
    else { condMoneda.push("a.estado = 'ACTIVO'") }
    if (tipo) { condMoneda.push('a.tipo = ?'); paramsMoneda.push(tipo) }
    if (periodo) { condMoneda.push('a.periodo = ?'); paramsMoneda.push(periodo) }
    if (fondoId) { condMoneda.push('fs.fondorotatorio_id = ?'); paramsMoneda.push(fondoId) }
    if (socioId) { condMoneda.push('fs.socio_id = ?'); paramsMoneda.push(socioId) }
    if (search) {
      const terms = search.split(/\s+/).filter(Boolean)
      for (const term of terms) {
        const like = `%${term}%`
        condMoneda.push('(a.comprobante LIKE ? OR a.periodo LIKE ? OR s.nombres LIKE ? OR s.apellidoPaterno LIKE ? OR s.apellidoMaterno LIKE ?)')
        paramsMoneda.push(like, like, like, like, like)
      }
    }

    const porMonedaSQL = prisma.$queryRawUnsafe<Array<{ moneda: string; total: string | number }>>(
      `SELECT f.moneda AS moneda, SUM(a.monto) AS total FROM aporte a JOIN FondoSocio fs ON a.FondoSocio_Id = fs.id JOIN fondorotatorio f ON fs.fondorotatorio_id = f.id JOIN socio s ON fs.socio_id = s.id WHERE ${condMoneda.join(' AND ')} GROUP BY f.moneda`,
      ...paramsMoneda,
    )

    const sumWhere: any = { ...where }
    if (!estado) sumWhere.estado = 'ACTIVO'
    const totalAgregadoPromise = prisma.aporte.aggregate({ where: sumWhere, _sum: { monto: true } })
    const totalActivosPromise = prisma.aporte.count({ where: activoWhere })

    const [data, total, porMonedaRows, totalAgregado, totalActivos] = await Promise.all([
      prisma.aporte.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaAporte: 'desc' },
        include: {
          fondoSocio: {
            select: {
              fechaIngreso: true,
              socio: {
                select: { id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true },
              },
              fondo: {
                select: { id: true, nombre: true, moneda: true },
              },
            },
          },
        },
      }),
      prisma.aporte.count({ where }),
      porMonedaSQL,
      totalAgregadoPromise,
      totalActivosPromise,
    ])

    const totalAportadoPorMoneda: Record<string, number> = {}
    for (const r of porMonedaRows) {
      totalAportadoPorMoneda[r.moneda] = Number(r.total)
    }
    const totalAportado = Number(totalAgregado._sum?.monto || 0)

    return {
      data: data.map((a) => {
        const { fondoSocio, ...rest } = a
        return {
          ...rest,
          monto: Number(a.monto),
          socio: fondoSocio.socio,
          fondo: fondoSocio.fondo,
        }
      }),
      total,
      totalAportado,
      totalAportadoPorMoneda,
      totalActivos,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const aporte = await prisma.aporte.findUnique({
      where: { id },
      include: {
        fondoSocio: {
          select: {
            fechaIngreso: true,
            socio: {
              select: { id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true },
            },
            fondo: {
              select: { id: true, nombre: true, moneda: true, capitalDisponible: true },
            },
          },
        },
      },
    })
    if (!aporte) return null

    const { fondoSocio, ...rest } = aporte
    return {
      ...rest,
      monto: Number(aporte.monto),
      socio: fondoSocio.socio,
      fondo: fondoSocio.fondo,
    }
  },

  async create(data: any) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
      include: {
        fondo: true,
        socio: { select: { nombres: true, apellidoPaterno: true } },
      },
    })
    if (!socioEnFondo) throw new HttpError(400, 'El socio no pertenece a este fondo')
    if (socioEnFondo.fechaSalida) throw new HttpError(400, 'El socio no está activo en este fondo')
    if (socioEnFondo.fondo.estado !== 'ACTIVO') throw new HttpError(400, 'El fondo no está activo')

    const aporte = await prisma.$transaction(async (tx) => {
      if (data.tipo === 'OBLIGATORIO') {
        const existe = await tx.aporte.findFirst({
          where: {
            fondoSocioId: socioEnFondo.id,
            tipo: 'OBLIGATORIO',
            periodo: data.periodo,
            estado: 'ACTIVO',
          },
        })
        if (existe) throw new HttpError(400, 'El socio ya tiene un aporte obligatorio registrado para este período')
      }

      const nuevoAporte = await tx.aporte.create({
        data: {
          tipo: data.tipo,
          monto: data.monto,
          periodo: data.periodo,
          fechaAporte: data.fechaAporte ? parseFechaLocal(data.fechaAporte) : new Date(),
          metodoPago: data.metodoPago || 'EFECTIVO',
          comprobante: data.comprobante || null,
          observacion: data.observacion || null,
          fondoSocioId: socioEnFondo.id,
          claveUnica: claveUnicaAporte(socioEnFondo.id, data.tipo, data.periodo),
        },
      })

      await tx.fondoRotatorio.update({
        where: { id: socioEnFondo.fondoId },
        data: { capitalDisponible: { increment: data.monto } },
      })

      // La caja del fondo debe reflejar el ingreso por aporte.
      await registrarMovimientoFondo(tx, socioEnFondo.fondoId, 'ING-APORTE', {
        tipo: 'INGRESO',
        monto: data.monto,
        descripcion: `Aporte ${data.tipo} ${data.periodo ? 'de periodo ' + data.periodo : ''} - ${socioEnFondo.socio?.nombres || ''} ${socioEnFondo.socio?.apellidoPaterno || ''}`.trim(),
        metodoPago: data.metodoPago,
        comprobante: data.comprobante || undefined,
        referencia: `APORTE-${nuevoAporte.id}`,
        fechaMovimiento: nuevoAporte.fechaAporte,
      })

      return nuevoAporte
    })

    await createAuditLog({
      tabla: 'Aporte',
      registroId: aporte.id,
      operacion: 'CREATE',
      datosNuevos: { tipo: aporte.tipo, monto: Number(aporte.monto), periodo: aporte.periodo, fondoId: socioEnFondo.fondoId, socioId: socioEnFondo.socioId },
    })

    return { ...aporte, monto: Number(aporte.monto) }
  },

  async update(id: number, data: any) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.aporte.findUnique({
        where: { id },
        include: { fondoSocio: { select: { id: true, fondoId: true } } },
      })
      if (!existing) return null
      if (existing.estado === 'ANULADO') throw new HttpError(400, 'No se puede modificar un aporte anulado')

      const updateData: any = {}
      if (data.tipo !== undefined) updateData.tipo = data.tipo
      if (data.monto !== undefined) updateData.monto = Number(data.monto)
      if (data.periodo !== undefined) updateData.periodo = data.periodo
      if (data.fechaAporte !== undefined) updateData.fechaAporte = parseFechaLocal(data.fechaAporte)
      if (data.metodoPago !== undefined) updateData.metodoPago = data.metodoPago
      if (data.comprobante !== undefined) updateData.comprobante = data.comprobante || null
      if (data.observacion !== undefined) updateData.observacion = data.observacion || null

      const nuevoTipo = data.tipo ?? existing.tipo
      const nuevoPeriodo = data.periodo ?? existing.periodo
      if (nuevoTipo === 'OBLIGATORIO' && (data.tipo !== undefined || data.periodo !== undefined)) {
        const existe = await tx.aporte.findFirst({
          where: {
            id: { not: id },
            fondoSocioId: existing.fondoSocio.id,
            tipo: 'OBLIGATORIO',
            periodo: nuevoPeriodo,
            estado: 'ACTIVO',
          },
        })
        if (existe) throw new HttpError(400, 'El socio ya tiene un aporte obligatorio registrado para este período')
      }
      if (data.tipo !== undefined || data.periodo !== undefined) {
        updateData.claveUnica = claveUnicaAporte(existing.fondoSocio.id, nuevoTipo, nuevoPeriodo)
      }

      const montoDiff = data.monto !== undefined ? Number(data.monto) - Number(existing.monto) : 0

      const updated = await tx.aporte.update({ where: { id }, data: updateData })

      if (montoDiff !== 0) {
        const fondo = await tx.fondoRotatorio.findUnique({ where: { id: existing.fondoSocio.fondoId } })
        if (fondo && Number(fondo.capitalDisponible) + montoDiff < 0) {
          throw new HttpError(400, 'No se puede reducir: el capital disponible del fondo sería negativo')
        }
        await tx.fondoRotatorio.update({
          where: { id: existing.fondoSocio.fondoId },
          data: { capitalDisponible: { increment: montoDiff } },
        })
      }

      // Mantener sincronizado el movimiento de caja vinculado al aporte.
      if (montoDiff !== 0 || data.fechaAporte !== undefined || data.metodoPago !== undefined || data.comprobante !== undefined) {
        await actualizarMovimientoCajaVinculado(tx, `APORTE-${existing.id}`, {
          deltaMonto: montoDiff,
          fechaMovimiento: data.fechaAporte !== undefined ? parseFechaLocal(data.fechaAporte) : undefined,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante !== undefined ? data.comprobante || null : undefined,
        })
      }

      return { updated, existing }
    })

    if (!result) return null

    const { updated, existing } = result
    await createAuditLog({
      tabla: 'Aporte',
      registroId: updated.id,
      operacion: 'UPDATE',
      datosAnteriores: {
        tipo: existing.tipo,
        monto: Number(existing.monto),
        periodo: existing.periodo,
        fechaAporte: existing.fechaAporte,
        metodoPago: existing.metodoPago,
        comprobante: existing.comprobante,
        observacion: existing.observacion,
      },
      datosNuevos: data,
    })

    return { ...updated, monto: Number(updated.monto) }
  },

  async delete(id: number) {
    const result = await prisma.$transaction(async (tx) => {
      const aporte = await tx.aporte.findUnique({
        where: { id },
        include: { fondoSocio: { select: { fondoId: true } } },
      })
      if (!aporte) return { success: false as const, message: 'Aporte no encontrado' }
      if (aporte.estado === 'ANULADO') return { success: false as const, message: 'El aporte ya está anulado' }

      const fondo = await tx.fondoRotatorio.findUnique({ where: { id: aporte.fondoSocio.fondoId } })
      if (fondo && Number(fondo.capitalDisponible) < Number(aporte.monto)) {
        return { success: false as const, message: 'No se puede anular: el capital disponible del fondo es insuficiente (préstamos activos)' }
      }

      await tx.aporte.update({
        where: { id },
        data: { estado: 'ANULADO', claveUnica: null },
      })
      await tx.fondoRotatorio.update({
        where: { id: aporte.fondoSocio.fondoId },
        data: { capitalDisponible: { decrement: Number(aporte.monto) } },
      })

      // Revertir el ingreso del aporte en la caja.
      await anularMovimientoCajaVinculado(tx, `APORTE-${id}`)

      return { success: true as const, message: 'Aporte anulado correctamente' }
    })

    if (result.success) {
      await createAuditLog({
        tabla: 'Aporte',
        registroId: id,
        operacion: 'DELETE',
        datosAnteriores: { estado: 'ACTIVO' },
      })
    }

    return result
  },
}
