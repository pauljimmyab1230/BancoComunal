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
          responsable: { select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true } },
          _count: { select: { socios: true } },
        },
      }),
      prisma.fondoRotatorio.count({ where }),
      prisma.fondoRotatorio.aggregate({
        _sum: { capitalInicial: true, capitalDisponible: true },
      }),
      prisma.fondoRotatorioSocio.count(),
    ])

    return {
      data: data.map((f) => ({
        ...f,
        capitalInicial: Number(f.capitalInicial),
        capitalDisponible: Number(f.capitalDisponible),
        totalSocios: f._count.socios,
        _count: undefined,
        responsable: undefined,
        responsableNombre: f.responsable
          ? `${f.responsable.nombres} ${f.responsable.apellidoPaterno}`
          : '—',
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
        responsable: {
          select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, correo: true },
        },
        socios: {
          include: {
            socio: {
              select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, estado: true },
            },
          },
        },
      },
    })

    if (!fondo) return null

    return {
      ...fondo,
      capitalInicial: Number(fondo.capitalInicial),
      capitalDisponible: Number(fondo.capitalDisponible),
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
        responsableId: data.responsableId,
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
    if (data.capitalInicial !== undefined) updateData.capitalInicial = Number(data.capitalInicial)
    if (data.capitalDisponible !== undefined) updateData.capitalDisponible = Number(data.capitalDisponible)
    if (data.moneda !== undefined) updateData.moneda = data.moneda
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.reglamento !== undefined) updateData.reglamento = data.reglamento || null
    if (data.condiciones !== undefined) updateData.condiciones = data.condiciones || null
    if (data.responsableId !== undefined) updateData.responsableId = Number(data.responsableId)
    if (data.fechaCierre !== undefined) updateData.fechaCierre = data.fechaCierre ? new Date(data.fechaCierre) : null

    const fondo = await prisma.fondoRotatorio.update({ where: { id }, data: updateData })
    return { ...fondo, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible) }
  },

  async delete(id: number) {
    const fondo = await prisma.fondoRotatorio.findUnique({
      where: { id },
      include: {
        _count: { select: { socios: true } },
        prestamos: { where: { estado: 'ACTIVO' }, select: { id: true } },
        aportes: { select: { id: true } },
        cuentasAhorro: { select: { id: true } },
      },
    })
    if (!fondo) return { success: false, message: 'Fondo no encontrado' }
    if (fondo.prestamos.length > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene préstamos activos' }
    }
    if (fondo.aportes.length > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene aportes registrados' }
    }
    if (fondo.cuentasAhorro.length > 0) {
      return { success: false, message: 'No se puede eliminar: el fondo tiene cuentas de ahorro' }
    }
    await prisma.fondoRotatorio.delete({ where: { id } })
    return { success: true, message: 'Fondo eliminado correctamente' }
  },

  // Socios del fondo
  async addSocio(fondoId: number, socioId: number) {
    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: fondoId } })
    if (!fondo) return null

    const socio = await prisma.socio.findUnique({ where: { id: socioId } })
    if (!socio) return null

    const existing = await prisma.fondoRotatorioSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (existing) return { message: 'El socio ya pertenece al fondo' }

    return prisma.fondoRotatorioSocio.create({
      data: { fondoId, socioId },
      include: { socio: true },
    })
  },

  async removeSocio(fondoId: number, socioId: number) {
    const rel = await prisma.fondoRotatorioSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (!rel) return { success: false, message: 'Relación no encontrada' }

    const [prestamosActivos, aportesCount] = await Promise.all([
      prisma.prestamo.count({ where: { fondoId, socioId, estado: 'ACTIVO' } }),
      prisma.aporte.count({ where: { fondoId, socioId } }),
    ])

    if (prestamosActivos > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene préstamos activos en este fondo' }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede retirar: el socio tiene aportes registrados en este fondo' }
    }

    await prisma.fondoRotatorioSocio.delete({ where: { id: rel.id } })
    return { success: true, message: 'Socio retirado del fondo' }
  },

  async getSocios(fondoId: number) {
    return prisma.fondoRotatorioSocio.findMany({
      where: { fondoId },
      include: {
        socio: {
          select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, telefono: true, estado: true },
        },
      },
      orderBy: { fechaIngreso: 'desc' },
    })
  },
}
