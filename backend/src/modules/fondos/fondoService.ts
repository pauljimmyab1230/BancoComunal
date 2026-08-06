import prisma from '../../config/prisma'
import { createAuditLog } from '../../config/auditLog'
import { HttpError } from '../../middeware/httpError'

export const fondoService = {
  async list(params: { search?: string; page?: number; limit?: number; estado?: string }) {
    const { search, page = 1, limit = 10, estado } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { organizacion: { contains: search } },
      ]
    }

    const [data, total, capitalResumen, totalSociosCount] = await Promise.all([
      prisma.fondoRotatorio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { fondosSocios: { where: { fechaSalida: null } } } },
        },
      }),
      prisma.fondoRotatorio.count({ where }),
      prisma.fondoRotatorio.groupBy({
        by: ['moneda'],
        _sum: { capitalInicial: true, capitalDisponible: true },
      }),
      prisma.fondoSocio.count({ where: { fechaSalida: null } }),
    ])

    return {
      data: data.map((f) => ({
        ...f,
        capitalInicial: Number(f.capitalInicial),
        capitalDisponible: Number(f.capitalDisponible),
        totalSocios: f._count.fondosSocios,
        _count: undefined,
      })),
      total,
      capitalResumen: capitalResumen.map((r) => ({
        moneda: r.moneda,
        capitalInicial: Number(r._sum?.capitalInicial || 0),
        capitalDisponible: Number(r._sum?.capitalDisponible || 0),
      })),
      totalSocios: totalSociosCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const [fondo, cuotasActivas, totalActivo] = await Promise.all([
      prisma.fondoRotatorio.findUnique({
        where: { id },
        include: {
          fondosSocios: {
            where: { fechaSalida: null },
            include: {
              socio: {
                select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, estado: true },
              },
            },
            orderBy: { fechaIngreso: 'desc' },
          },
        },
      }),
      prisma.cuotaPrestamo.findMany({
        where: { prestamo: { fondoSocio: { fondoId: id }, estado: 'ACTIVO' } },
        select: { monto: true, amortizacion: true, montoPagado: true },
      }),
      prisma.prestamo.aggregate({
        where: { fondoSocio: { fondoId: id }, estado: 'ACTIVO' },
        _sum: { monto: true },
      }),
    ])

    if (!fondo) return null

    // Capital recuperado = suma de amortizaciones pagadas (sin intereses).
    const capitalRecuperado = Math.round(cuotasActivas.reduce((a, c) => {
      const cMonto = Number(c.monto)
      const cPagado = Number(c.montoPagado)
      if (cPagado <= 0) return a
      const proporcion = cMonto > 0 ? Math.min(1, cPagado / cMonto) : 1
      return a + Number(c.amortizacion) * proporcion
    }, 0) * 100) / 100
    // Capital prestado pendiente = total desembolsado activo menos capital recuperado.
    const capitalPrestado = Math.round((Number(totalActivo._sum?.monto || 0) - capitalRecuperado) * 100) / 100

    return {
      ...fondo,
      capitalInicial: Number(fondo.capitalInicial),
      capitalDisponible: Number(fondo.capitalDisponible),
      capitalPrestado,
      socios: fondo.fondosSocios,
      fondosSocios: undefined,
    }
  },

  async create(data: any) {
    const fondo = await prisma.fondoRotatorio.create({
      data: {
        nombre: data.nombre,
        organizacion: data.organizacion || '',
        capitalInicial: data.capitalInicial,
        capitalDisponible: data.capitalDisponible ?? data.capitalInicial,
        moneda: data.moneda || 'PEN',
        estado: data.estado || 'ACTIVO',
        descripcion: data.descripcion || null,
        reglamento: data.reglamento || null,
        condiciones: data.condiciones || null,
        fechaCierre: data.fechaCierre ? new Date(data.fechaCierre) : null,
      },
    })

    await createAuditLog({
      tabla: 'FondoRotatorio',
      registroId: fondo.id,
      operacion: 'CREATE',
      datosNuevos: { nombre: fondo.nombre, organizacion: fondo.organizacion, capitalInicial: Number(fondo.capitalInicial), moneda: fondo.moneda, estado: fondo.estado },
    })

    return { ...fondo, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible) }
  },

  async update(id: number, data: any) {
    const existing = await prisma.fondoRotatorio.findUnique({ where: { id } })
    if (!existing) return null

    if (data.capitalDisponible !== undefined) {
      throw new HttpError(400, 'El capital disponible no puede modificarse manualmente; se ajusta con los movimientos del fondo')
    }

    const updateData: any = {}
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.organizacion !== undefined) updateData.organizacion = data.organizacion
    if (data.capitalInicial !== undefined) {
      const nuevoCapitalInicial = Number(data.capitalInicial)
      // No permitir reducir el capital por debajo de lo ya comprometido en préstamos.
      const capitalUsado = Number(existing.capitalInicial) - Number(existing.capitalDisponible)
      if (nuevoCapitalInicial < capitalUsado) {
        throw new HttpError(400, `El capital inicial no puede ser menor a ${capitalUsado.toFixed(2)} (capital comprometido en préstamos)`)
      }
      updateData.capitalInicial = nuevoCapitalInicial
      const diff = nuevoCapitalInicial - Number(existing.capitalInicial)
      updateData.capitalDisponible = Math.max(0, Number(existing.capitalDisponible) + diff)
    }
    if (data.moneda !== undefined && data.moneda !== existing.moneda) {
      const [prestamosCount, aportesCount] = await Promise.all([
        prisma.prestamo.count({ where: { fondoSocio: { fondoId: id } } }),
        prisma.aporte.count({ where: { fondoSocio: { fondoId: id } } }),
      ])
      if (prestamosCount > 0 || aportesCount > 0) {
        throw new HttpError(400, 'No se puede cambiar la moneda de un fondo con préstamos o aportes registrados')
      }
      updateData.moneda = data.moneda
    }
    if (data.estado !== undefined) {
      updateData.estado = data.estado
      if (data.estado === 'CERRADO' && !existing.fechaCierre) {
        updateData.fechaCierre = new Date()
      }
      if (data.estado === 'ACTIVO') {
        updateData.fechaCierre = null
      }
    }
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.reglamento !== undefined) updateData.reglamento = data.reglamento || null
    if (data.condiciones !== undefined) updateData.condiciones = data.condiciones || null
    if (data.fechaCierre !== undefined) updateData.fechaCierre = data.fechaCierre ? new Date(data.fechaCierre) : null

    const fondo = await prisma.fondoRotatorio.update({ where: { id }, data: updateData })

    await createAuditLog({
      tabla: 'FondoRotatorio',
      registroId: fondo.id,
      operacion: 'UPDATE',
      datosAnteriores: { nombre: existing.nombre, capitalInicial: Number(existing.capitalInicial), capitalDisponible: Number(existing.capitalDisponible), estado: existing.estado },
      datosNuevos: updateData,
    })

    return { ...fondo, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible) }
  },

  async delete(id: number) {
    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id } })
    if (!fondo) return { success: false, message: 'Fondo no encontrado' }

    const [prestamosCount, aportesCount, cajasCount, membresiasCount] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocio: { fondoId: id }, estado: 'ACTIVO' } }),
      prisma.aporte.count({ where: { fondoSocio: { fondoId: id } } }),
      prisma.caja.count({ where: { fondoId: id } }),
      prisma.fondoSocio.count({ where: { fondoId: id } }),
    ])

    if (membresiasCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene socios asignados' }
    }
    if (prestamosCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene préstamos activos' }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene aportes registrados' }
    }
    if (cajasCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene cajas registradas' }
    }

    await createAuditLog({
      tabla: 'FondoRotatorio',
      registroId: id,
      operacion: 'DELETE',
      datosAnteriores: { nombre: fondo.nombre, estado: fondo.estado },
    })

    await prisma.fondoRotatorio.delete({ where: { id } })
    return { success: true, message: 'Fondo eliminado correctamente' }
  },

  // Socios del fondo
  async addSocio(fondoId: number, socioId: number, data: any = {}) {
    const [fondo, socio] = await Promise.all([
      prisma.fondoRotatorio.findUnique({ where: { id: fondoId } }),
      prisma.socio.findUnique({ where: { id: socioId } }),
    ])
    if (!fondo || !socio) return null
    if (fondo.estado !== 'ACTIVO') return { success: false as const, message: 'No se puede agregar socios a un fondo que no está activo' }
    if (socio.estado !== 'A') return { success: false as const, message: 'No se puede agregar un socio inactivo al fondo' }

    const existing = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (existing) {
      if (!existing.fechaSalida) return { success: false as const, message: 'El socio ya pertenece al fondo' }

      const rel = await prisma.fondoSocio.update({
        where: { id: existing.id },
        data: {
          fechaSalida: null,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
          numeroSocio: data.numeroSocio !== undefined ? Number(data.numeroSocio) : existing.numeroSocio,
          cargo: data.cargo !== undefined ? data.cargo : existing.cargo,
          nivel: data.nivel !== undefined ? data.nivel : existing.nivel,
          observacion: data.observacion !== undefined ? data.observacion : existing.observacion,
        },
        include: { socio: true },
      })
      await createAuditLog({
        tabla: 'FondoSocio',
        registroId: rel.id,
        operacion: 'CREATE',
        datosNuevos: { fondoId, socioId, numeroSocio: rel.numeroSocio, fechaIngreso: rel.fechaIngreso },
      })
      return { success: true as const, data: rel }
    }

    let numeroSocio = data.numeroSocio !== undefined ? Number(data.numeroSocio) : null
    if (numeroSocio === null) {
      // Cálculo y alta dentro de una transacción para reducir el riesgo de
      // asignar el mismo número a dos socios en altas concurrentes.
      numeroSocio = await prisma.$transaction(async (tx) => {
        const maxAgg = await tx.fondoSocio.aggregate({
          where: { fondoId },
          _max: { numeroSocio: true },
        })
        return (maxAgg._max.numeroSocio ?? 0) + 1
      })
    }

    const rel = await prisma.fondoSocio.create({
      data: {
        fondoId,
        socioId,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
        numeroSocio,
        cargo: data.cargo || null,
        nivel: data.nivel || null,
        observacion: data.observacion || null,
        fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : null,
      },
      include: { socio: true },
    })
    await createAuditLog({
      tabla: 'FondoSocio',
      registroId: rel.id,
      operacion: 'CREATE',
      datosNuevos: { fondoId, socioId, numeroSocio: rel.numeroSocio, fechaIngreso: rel.fechaIngreso },
    })
    return { success: true as const, data: rel }
  },

  async removeSocio(fondoId: number, socioId: number) {
    const rel = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (!rel) return { success: false, message: 'Relación no encontrada' }
    if (rel.fechaSalida) return { success: false, message: 'El socio ya fue retirado del fondo' }

    const [prestamosActivos, aportesActivos] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocioId: rel.id, estado: 'ACTIVO' } }),
      prisma.aporte.count({ where: { fondoSocioId: rel.id, estado: 'ACTIVO' } }),
    ])

    if (prestamosActivos > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene préstamos activos en este fondo' }
    }
    if (aportesActivos > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene aportes activos en este fondo' }
    }

    await prisma.fondoSocio.update({
      where: { id: rel.id },
      data: { fechaSalida: new Date() },
    })
    await createAuditLog({
      tabla: 'FondoSocio',
      registroId: rel.id,
      operacion: 'DELETE',
      datosAnteriores: { fondoId, socioId, numeroSocio: rel.numeroSocio },
    })
    return { success: true, message: 'Socio retirado del fondo' }
  },

  async getSocios(fondoId: number) {
    return prisma.fondoSocio.findMany({
      where: { fondoId, fechaSalida: null },
      include: {
        socio: {
          select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, telefono: true, estado: true },
        },
      },
      orderBy: { fechaIngreso: 'desc' },
    })
  },
}
