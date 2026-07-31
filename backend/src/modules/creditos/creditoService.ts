import prisma from '../../config/prisma'

const socioSelect = {
  id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true,
} as const

const fondoSocioSelect = {
  id: true,
  fechaIngreso: true,
  socio: { select: socioSelect },
  fondo: { select: { id: true, nombre: true, moneda: true } },
} as const

export const creditoService = {
  async list(params: { search?: string; page?: number; limit?: number; fondoId?: number; socioId?: number; estado?: string }) {
    const { search, page = 1, limit = 10, fondoId, socioId, estado } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado

    const fondoSocioWhere: any = {}
    if (fondoId) fondoSocioWhere.fondoId = fondoId
    if (socioId) fondoSocioWhere.socioId = socioId
    if (Object.keys(fondoSocioWhere).length > 0) where.fondoSocio = fondoSocioWhere

    if (search) {
      where.OR = [
        { fondoSocio: { socio: { nombres: { contains: search } } } },
        { fondoSocio: { socio: { apellidoPaterno: { contains: search } } } },
        { fondoSocio: { socio: { codigo: { contains: search } } } },
      ]
    }

    const [data, total, aggregates, totalActivos] = await Promise.all([
      prisma.prestamo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fondoSocio: { select: fondoSocioSelect },
          _count: { select: { cuotas: true } },
        },
      }),
      prisma.prestamo.count({ where }),
      prisma.prestamo.aggregate({
        where,
        _sum: { monto: true },
      }),
      prisma.prestamo.count({ where: { ...where, estado: 'ACTIVO' } }),
    ])

    return {
      data: data.map((p) => {
        const { fondoSocio, ...rest } = p
        return {
          ...rest,
          monto: Number(p.monto),
          tasaInteres: Number(p.tasaInteres),
          montoCuota: Number(p.montoCuota),
          totalInteres: Number(p.totalInteres),
          socio: fondoSocio?.socio ?? null,
          fondo: fondoSocio?.fondo ?? null,
          _count: undefined,
          totalCuotas: p._count.cuotas,
        }
      }),
      total,
      totalPrestado: Number(aggregates._sum.monto || 0),
      totalActivos,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const prestamo = await prisma.prestamo.findUnique({
      where: { id },
      include: {
        fondoSocio: { select: fondoSocioSelect },
        cuotas: { orderBy: { numero: 'asc' } },
      },
    })
    if (!prestamo) return null

    const { fondoSocio, ...rest } = prestamo
    return {
      ...rest,
      monto: Number(prestamo.monto),
      tasaInteres: Number(prestamo.tasaInteres),
      montoCuota: Number(prestamo.montoCuota),
      totalInteres: Number(prestamo.totalInteres),
      socio: fondoSocio?.socio ?? null,
      fondo: fondoSocio?.fondo ?? null,
      cuotas: prestamo.cuotas.map((c) => ({
        ...c,
        monto: Number(c.monto),
        interes: Number(c.interes),
        amortizacion: Number(c.amortizacion),
        saldo: Number(c.saldo),
        montoPagado: Number(c.montoPagado),
        saldoPendiente: Number(c.saldoPendiente),
      })),
    }
  },

  async getByFondoSocio(fondoId: number, socioId: number) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (!socioEnFondo) return []

    const prestamos = await prisma.prestamo.findMany({
      where: { fondoSocioId: socioEnFondo.id },
      orderBy: { createdAt: 'desc' },
      include: {
        cuotas: { orderBy: { numero: 'asc' } },
      },
    })
    return prestamos.map((p) => ({
      ...p,
      monto: Number(p.monto),
      tasaInteres: Number(p.tasaInteres),
      montoCuota: Number(p.montoCuota),
      totalInteres: Number(p.totalInteres),
      cuotas: p.cuotas.map((c) => ({
        ...c,
        monto: Number(c.monto),
        interes: Number(c.interes),
        amortizacion: Number(c.amortizacion),
        saldo: Number(c.saldo),
        montoPagado: Number(c.montoPagado),
        saldoPendiente: Number(c.saldoPendiente),
      })),
    }))
  },

  async crear(data: {
    monto: number
    tasaInteres: number
    numeroCuotas: number
    fechaPrimerVencimiento: string
    fondoId: number
    socioId: number
  }) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
      include: { fondo: true },
    })
    if (!socioEnFondo) throw new Error('El socio no pertenece a este fondo')
    if (socioEnFondo.fechaSalida) throw new Error('El socio no está activo en este fondo')
    if (socioEnFondo.fondo.estado !== 'ACTIVO') throw new Error('El fondo no está activo')
    if (Number(socioEnFondo.fondo.capitalDisponible) < data.monto) throw new Error('El fondo no tiene capital disponible suficiente')

    if (data.monto <= 0) throw new Error('El monto debe ser mayor a 0')
    if (data.numeroCuotas < 1) throw new Error('Debe haber al menos 1 cuota')
    if (data.tasaInteres < 0) throw new Error('La tasa de interés no puede ser negativa')

    // Amortización francesa: cuota fija
    const i = data.tasaInteres / 100
    const n = data.numeroCuotas
    const montoCuota = i > 0
      ? (data.monto * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
      : data.monto / n
    const totalInteres = montoCuota * n - data.monto

    const prestamo = await prisma.$transaction(async (tx) => {
      // Reducir capital disponible del fondo
      await tx.fondoRotatorio.update({
        where: { id: socioEnFondo.fondoId },
        data: { capitalDisponible: { decrement: data.monto } },
      })

      const p = await tx.prestamo.create({
        data: {
          monto: data.monto,
          tasaInteres: data.tasaInteres,
          numeroCuotas: data.numeroCuotas,
          montoCuota: Math.round(montoCuota * 100) / 100,
          totalInteres: Math.round(totalInteres * 100) / 100,
          fechaPrimerVencimiento: new Date(data.fechaPrimerVencimiento),
          estado: 'ACTIVO',
          fondoSocioId: socioEnFondo.id,
        },
      })

      // Generar cuotas (amortización francesa)
      const montoC = Math.round(montoCuota * 100) / 100
      const cuotasData = []
      let saldoRestante = data.monto
      for (let idx = 1; idx <= data.numeroCuotas; idx++) {
        const fechaVenc = new Date(data.fechaPrimerVencimiento)
        fechaVenc.setMonth(fechaVenc.getMonth() + (idx - 1))
        const interesCuota = Math.round(saldoRestante * i * 100) / 100
        const amortizacionCuota = Math.round((montoC - interesCuota) * 100) / 100
        saldoRestante = Math.round((saldoRestante - amortizacionCuota) * 100) / 100

        cuotasData.push({
          numero: idx,
          fechaVencimiento: fechaVenc,
          monto: montoC,
          interes: interesCuota,
          amortizacion: amortizacionCuota,
          saldo: Math.max(saldoRestante, 0),
          montoPagado: 0,
          saldoPendiente: montoC,
          estado: 'PENDIENTE',
          prestamoId: p.id,
        })
      }

      await tx.cuotaPrestamo.createMany({ data: cuotasData })
      return p
    })

    return {
      ...prestamo,
      monto: Number(prestamo.monto),
      tasaInteres: Number(prestamo.tasaInteres),
      montoCuota: Number(prestamo.montoCuota),
      totalInteres: Number(prestamo.totalInteres),
    }
  },

  async pagarCuota(data: {
    cuotaId: number
    monto: number
    fechaPago?: string
    metodoPago: string
    comprobante?: string | null
  }) {
    if (data.monto <= 0) throw new Error('El monto debe ser mayor a 0')

    const cuota = await prisma.cuotaPrestamo.findUnique({
      where: { id: data.cuotaId },
      include: { prestamo: { include: { fondoSocio: { select: { fondoId: true } } } } },
    })
    if (!cuota) throw new Error('Cuota no encontrada')
    if (cuota.estado === 'PAGADO') throw new Error('La cuota ya está pagada')

    if (data.monto > Number(cuota.saldoPendiente)) {
      throw new Error('El monto excede el saldo pendiente de la cuota')
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.cuotaPrestamo.update({
        where: { id: data.cuotaId },
        data: {
          montoPagado: { increment: data.monto },
          saldoPendiente: { decrement: data.monto },
          fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || null,
          estado: data.monto >= Number(cuota.saldoPendiente) ? 'PAGADO' : 'PARCIAL',
        },
      })

      // Incrementar capital disponible del fondo
      await tx.fondoRotatorio.update({
        where: { id: cuota.prestamo.fondoSocio.fondoId },
        data: { capitalDisponible: { increment: data.monto } },
      })

      // Verificar si todas las cuotas están pagadas
      const pendientes = await tx.cuotaPrestamo.count({
        where: { prestamoId: cuota.prestamoId, estado: { notIn: ['PAGADO'] } },
      })
      if (pendientes === 0) {
        await tx.prestamo.update({
          where: { id: cuota.prestamoId },
          data: { estado: 'PAGADO' },
        })
      }

      return updated
    })

    return {
      ...result,
      monto: Number(result.monto),
      montoPagado: Number(result.montoPagado),
      saldoPendiente: Number(result.saldoPendiente),
    }
  },

  async anular(id: number) {
    const prestamo = await prisma.prestamo.findUnique({
      where: { id },
      include: { cuotas: true, fondoSocio: { select: { fondoId: true } } },
    })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.estado === 'ANULADO') throw new Error('El préstamo ya está anulado')

    const cuotasPagadas = prestamo.cuotas.some((c) => Number(c.montoPagado) > 0)
    if (cuotasPagadas) throw new Error('No se puede anular un préstamo con cuotas pagadas')

    await prisma.$transaction(async (tx) => {
      await tx.fondoRotatorio.update({
        where: { id: prestamo.fondoSocio.fondoId },
        data: { capitalDisponible: { increment: Number(prestamo.monto) } },
      })

      await tx.cuotaPrestamo.updateMany({
        where: { prestamoId: id },
        data: { estado: 'ANULADO' },
      })

      await tx.prestamo.update({
        where: { id },
        data: { estado: 'ANULADO' },
      })
    })

    return { success: true }
  },
}
