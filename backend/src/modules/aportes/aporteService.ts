import prisma from '../../config/prisma'

async function createAuditLog(data: { tabla: string; registroId: number; operacion: string; datosAnteriores?: any; datosNuevos?: any }) {
  try {
    await prisma.auditLog.create({ data })
  } catch { /* tabla puede no existir */ }
}

export const aporteService = {
  async list(params: {
    search?: string
    page?: number
    limit?: number
    estado?: string
    fondoId?: number
    socioId?: number
  }) {
    const { search, page = 1, limit = 10, estado, fondoId, socioId } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado

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

    const [data, total, aggregates] = await Promise.all([
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
      prisma.aporte.aggregate({
        where: { estado: 'ACTIVO' },
        _sum: { monto: true },
        _count: true,
      }),
    ])

    return {
      data: data.map((a) => {
        const { fondoSocio, ...rest } = a
        return {
          ...rest,
          monto: Number(a.monto),
          socio: fondoSocio?.socio ?? null,
          fondo: fondoSocio?.fondo ?? null,
        }
      }),
      total,
      totalAportado: Number(aggregates._sum.monto || 0),
      totalActivos: aggregates._count,
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
      socio: fondoSocio?.socio ?? null,
      fondo: fondoSocio?.fondo ?? null,
    }
  },

  async create(data: any) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
      include: { fondo: true },
    })
    if (!socioEnFondo) throw new Error('El socio no pertenece a este fondo')
    if (socioEnFondo.fechaSalida) throw new Error('El socio no está activo en este fondo')
    if (socioEnFondo.fondo.estado !== 'ACTIVO') throw new Error('El fondo no está activo')

    const aporte = await prisma.$transaction(async (tx) => {
      const nuevoAporte = await tx.aporte.create({
        data: {
          tipo: data.tipo,
          monto: data.monto,
          periodo: data.periodo,
          fechaAporte: data.fechaAporte ? new Date(data.fechaAporte) : new Date(),
          metodoPago: data.metodoPago || 'EFECTIVO',
          comprobante: data.comprobante || null,
          observacion: data.observacion || null,
          fondoSocioId: socioEnFondo.id,
        },
      })

      await tx.fondoRotatorio.update({
        where: { id: socioEnFondo.fondoId },
        data: { capitalDisponible: { increment: data.monto } },
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
    const aporte = await prisma.$transaction(async (tx) => {
      const existing = await tx.aporte.findUnique({
        where: { id },
        include: { fondoSocio: { select: { fondoId: true } } },
      })
      if (!existing) return null
      if (existing.estado === 'ANULADO') throw new Error('No se puede modificar un aporte anulado')

      const updateData: any = {}
      if (data.tipo !== undefined) updateData.tipo = data.tipo
      if (data.monto !== undefined) updateData.monto = Number(data.monto)
      if (data.periodo !== undefined) updateData.periodo = data.periodo
      if (data.fechaAporte !== undefined) updateData.fechaAporte = new Date(data.fechaAporte)
      if (data.metodoPago !== undefined) updateData.metodoPago = data.metodoPago
      if (data.comprobante !== undefined) updateData.comprobante = data.comprobante || null
      if (data.observacion !== undefined) updateData.observacion = data.observacion || null

      const montoDiff = data.monto !== undefined ? Number(data.monto) - Number(existing.monto) : 0

      const updated = await tx.aporte.update({ where: { id }, data: updateData })

      if (montoDiff !== 0) {
        const fondo = await tx.fondoRotatorio.findUnique({ where: { id: existing.fondoSocio.fondoId } })
        if (fondo && Number(fondo.capitalDisponible) + montoDiff < 0) {
          throw new Error('No se puede reducir: el capital disponible del fondo sería negativo')
        }
        await tx.fondoRotatorio.update({
          where: { id: existing.fondoSocio.fondoId },
          data: { capitalDisponible: { increment: montoDiff } },
        })
      }

      return updated
    })

    if (!aporte) return null

    await createAuditLog({
      tabla: 'Aporte',
      registroId: aporte.id,
      operacion: 'UPDATE',
      datosAnteriores: { monto: Number(aporte.monto) },
      datosNuevos: data,
    })

    const result = await prisma.aporte.findUniqueOrThrow({ where: { id } })
    return { ...result, monto: Number(result.monto) }
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
        data: { estado: 'ANULADO' },
      })
      await tx.fondoRotatorio.update({
        where: { id: aporte.fondoSocio.fondoId },
        data: { capitalDisponible: { decrement: Number(aporte.monto) } },
      })

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
