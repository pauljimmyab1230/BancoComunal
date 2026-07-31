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

export const ahorroService = {
  // === CUENTAS ===
  async listCuentas(params: { search?: string; page?: number; limit?: number; fondoId?: number; socioId?: number }) {
    const { search, page = 1, limit = 10, fondoId, socioId } = params
    const skip = (page - 1) * limit

    const where: any = {}
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

    const [data, total] = await Promise.all([
      prisma.cuentaAhorro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fondoSocio: { select: fondoSocioSelect },
          _count: { select: { movimientos: true } },
        },
      }),
      prisma.cuentaAhorro.count({ where }),
    ])

    return {
      data: data.map((c) => {
        const { fondoSocio, ...rest } = c
        return {
          ...rest,
          saldo: Number(c.saldo),
          totalMovimientos: c._count.movimientos,
          socio: fondoSocio?.socio ?? null,
          fondo: fondoSocio?.fondo ?? null,
          _count: undefined,
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getCuenta(id: number, movPage = 1, movLimit = 20) {
    const skip = (movPage - 1) * movLimit

    const cuenta = await prisma.cuentaAhorro.findUnique({
      where: { id },
      include: {
        fondoSocio: { select: fondoSocioSelect },
      },
    })
    if (!cuenta) return null

    const [movimientos, totalMovimientos] = await Promise.all([
      prisma.ahorroMovimiento.findMany({
        where: { cuentaId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: movLimit,
      }),
      prisma.ahorroMovimiento.count({ where: { cuentaId: id } }),
    ])

    const { fondoSocio, ...rest } = cuenta
    return {
      ...rest,
      saldo: Number(cuenta.saldo),
      socio: fondoSocio?.socio ?? null,
      fondo: fondoSocio?.fondo ?? null,
      movimientos: movimientos.map((m) => ({
        ...m,
        monto: Number(m.monto),
        saldoAntes: Number(m.saldoAntes),
        saldoDespues: Number(m.saldoDespues),
      })),
      movimientosTotal: totalMovimientos,
      movimientosPage: movPage,
      movimientosTotalPages: Math.ceil(totalMovimientos / movLimit),
    }
  },

  async getCuentaByFondoYSocio(fondoId: number, socioId: number) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
    })
    if (!socioEnFondo) return null

    const cuenta = await prisma.cuentaAhorro.findFirst({
      where: { fondoSocioId: socioEnFondo.id },
      include: {
        fondoSocio: { select: fondoSocioSelect },
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!cuenta) return null

    const { fondoSocio, ...rest } = cuenta
    return {
      ...rest,
      saldo: Number(cuenta.saldo),
      socio: fondoSocio?.socio ?? null,
      fondo: fondoSocio?.fondo ?? null,
      movimientos: cuenta.movimientos.map((m) => ({
        ...m,
        monto: Number(m.monto),
        saldoAntes: Number(m.saldoAntes),
        saldoDespues: Number(m.saldoDespues),
      })),
    }
  },

  async crearCuenta(data: { fondoId: number; socioId: number }) {
    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
    })
    if (!socioEnFondo) throw new Error('El socio no pertenece a este fondo')
    if (socioEnFondo.fechaSalida) throw new Error('El socio no está activo en este fondo')

    const existente = await prisma.cuentaAhorro.findFirst({
      where: { fondoSocioId: socioEnFondo.id },
    })
    if (existente) throw new Error('El socio ya tiene una cuenta de ahorro en este fondo')

    return prisma.cuentaAhorro.create({
      data: {
        saldo: 0,
        fondoSocioId: socioEnFondo.id,
      },
    })
  },

  async actualizarEstado(id: number, estado: string) {
    if (!['ACTIVA', 'INACTIVA'].includes(estado)) {
      throw new Error('Estado inválido. Debe ser ACTIVA o INACTIVA')
    }

    const cuenta = await prisma.cuentaAhorro.findUnique({ where: { id } })
    if (!cuenta) throw new Error('Cuenta de ahorro no encontrada')

    if (cuenta.estado === estado) {
      throw new Error(`La cuenta ya está ${estado === 'ACTIVA' ? 'activa' : 'inactiva'}`)
    }

    if (estado === 'INACTIVA' && Number(cuenta.saldo) > 0) {
      throw new Error('No se puede inactivar una cuenta con saldo positivo. Realice los retiros necesarios primero.')
    }

    return prisma.cuentaAhorro.update({
      where: { id },
      data: { estado: estado as any },
    })
  },

  // === MOVIMIENTOS ===
  async crearMovimiento(data: {
    tipo: 'DEPOSITO' | 'RETIRO'
    monto: number
    metodoPago: string
    comprobante?: string | null
    observacion?: string | null
    cuentaId: number
  }) {
    if (data.monto <= 0) throw new Error('El monto debe ser mayor a 0')

    const cuenta = await prisma.cuentaAhorro.findUnique({
      where: { id: data.cuentaId },
      include: { fondoSocio: { select: { fondoId: true } } },
    })
    if (!cuenta) throw new Error('Cuenta de ahorro no encontrada')
    if (cuenta.estado !== 'ACTIVA') throw new Error('La cuenta no está activa')

    const saldoActual = Number(cuenta.saldo)
    if (data.tipo === 'RETIRO' && data.monto > saldoActual) {
      throw new Error('Saldo insuficiente para el retiro')
    }

    const montoCambio = data.tipo === 'DEPOSITO' ? data.monto : -data.monto

    const movimiento = await prisma.$transaction(async (tx) => {
      const updated = await tx.cuentaAhorro.update({
        where: { id: data.cuentaId },
        data: { saldo: { increment: montoCambio } },
      })

      const mov = await tx.ahorroMovimiento.create({
        data: {
          tipo: data.tipo,
          monto: data.monto,
          saldoAntes: saldoActual,
          saldoDespues: Number(updated.saldo),
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || null,
          observacion: data.observacion || null,
          cuentaId: data.cuentaId,
        },
      })

      await tx.fondoRotatorio.update({
        where: { id: cuenta.fondoSocio.fondoId },
        data: { capitalDisponible: { increment: montoCambio } },
      })

      return mov
    })

    return { ...movimiento, monto: Number(movimiento.monto), saldoAntes: Number(movimiento.saldoAntes), saldoDespues: Number(movimiento.saldoDespues) }
  },

  async listMovimientos(params: { page?: number; limit?: number; cuentaId?: number }) {
    const { page = 1, limit = 10, cuentaId } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (cuentaId) where.cuentaId = cuentaId

    const [data, total] = await Promise.all([
      prisma.ahorroMovimiento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cuenta: {
            include: {
              fondoSocio: { select: fondoSocioSelect },
            },
          },
        },
      }),
      prisma.ahorroMovimiento.count({ where }),
    ])

    return {
      data: data.map((m) => {
        const { cuenta, ...rest } = m
        return {
          ...rest,
          monto: Number(m.monto),
          saldoAntes: Number(m.saldoAntes),
          saldoDespues: Number(m.saldoDespues),
          cuenta: {
            ...cuenta,
            socio: cuenta?.fondoSocio?.socio ?? null,
            fondo: cuenta?.fondoSocio?.fondo ?? null,
            fondoSocio: undefined,
          },
        }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },
}
