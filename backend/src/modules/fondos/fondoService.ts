import prisma from '../../config/prisma'

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

    const [data, total, aggregates, totalSociosCount] = await Promise.all([
      prisma.fondoRotatorio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { fondosSocios: true } },
        },
      }),
      prisma.fondoRotatorio.count({ where }),
      prisma.fondoRotatorio.aggregate({
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
      totalCapitalInicial: Number(aggregates._sum?.capitalInicial || 0),
      totalCapitalDisponible: Number(aggregates._sum?.capitalDisponible || 0),
      totalSocios: totalSociosCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const fondo = await prisma.fondoRotatorio.findUnique({
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
    })

    if (!fondo) return null

    return {
      ...fondo,
      capitalInicial: Number(fondo.capitalInicial),
      capitalDisponible: Number(fondo.capitalDisponible),
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
      },
    })

    return { ...fondo, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible) }
  },

  async update(id: number, data: any) {
    const existing = await prisma.fondoRotatorio.findUnique({ where: { id } })
    if (!existing) return null

    const updateData: any = {}
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.organizacion !== undefined) updateData.organizacion = data.organizacion
    if (data.capitalInicial !== undefined) {
      updateData.capitalInicial = Number(data.capitalInicial)
      if (data.capitalDisponible === undefined) {
        const diff = updateData.capitalInicial - Number(existing.capitalInicial)
        updateData.capitalDisponible = Math.max(0, Number(existing.capitalDisponible) + diff)
      }
    }
    if (data.capitalDisponible !== undefined) updateData.capitalDisponible = Number(data.capitalDisponible)
    if (data.moneda !== undefined) updateData.moneda = data.moneda
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.reglamento !== undefined) updateData.reglamento = data.reglamento || null
    if (data.condiciones !== undefined) updateData.condiciones = data.condiciones || null
    if (data.fechaCierre !== undefined) updateData.fechaCierre = data.fechaCierre ? new Date(data.fechaCierre) : null

    const fondo = await prisma.fondoRotatorio.update({ where: { id }, data: updateData })
    return { ...fondo, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible) }
  },

  async delete(id: number) {
    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id } })
    if (!fondo) return { success: false, message: 'Fondo no encontrado' }

    const [prestamosCount, aportesCount, cuentasCount, cajasCount] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocio: { fondoId: id }, estado: 'ACTIVO' } }),
      prisma.aporte.count({ where: { fondoSocio: { fondoId: id } } }),
      prisma.cuentaAhorro.count({ where: { fondoSocio: { fondoId: id } } }),
      prisma.caja.count({ where: { fondoId: id } }),
    ])

    if (prestamosCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene préstamos activos' }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene aportes registrados' }
    }
    if (cuentasCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene cuentas de ahorro' }
    }
    if (cajasCount > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene cajas registradas' }
    }
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
      return { success: true as const, data: rel }
    }

    const rel = await prisma.fondoSocio.create({
      data: {
        fondoId,
        socioId,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
        numeroSocio: data.numeroSocio !== undefined ? Number(data.numeroSocio) : null,
        cargo: data.cargo || null,
        nivel: data.nivel || null,
        observacion: data.observacion || null,
        fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion) : null,
      },
      include: { socio: true },
    })
    return { success: true as const, data: rel }
  },

  async removeSocio(fondoId: number, socioId: number) {
    const rel = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (!rel) return { success: false, message: 'Relación no encontrada' }
    if (rel.fechaSalida) return { success: false, message: 'El socio ya fue retirado del fondo' }

    const [prestamosCount, aportesCount, cuentasCount] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocioId: rel.id } }),
      prisma.aporte.count({ where: { fondoSocioId: rel.id } }),
      prisma.cuentaAhorro.count({ where: { fondoSocioId: rel.id } }),
    ])

    if (prestamosCount > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene préstamos registrados en este fondo' }
    }
    if (cuentasCount > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene cuentas de ahorro en este fondo' }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene aportes registrados en este fondo' }
    }

    await prisma.fondoSocio.update({
      where: { id: rel.id },
      data: { fechaSalida: new Date() },
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
