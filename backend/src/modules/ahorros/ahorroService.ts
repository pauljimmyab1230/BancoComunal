import prisma from '../../config/prisma'
import { Prisma } from '@prisma/client'

export const ahorroService = {
  // === CUENTAS ===
  async listCuentas(params: { search?: string; page?: number; limit?: number; fondoId?: number; socioId?: number }) {
    const { search, page = 1, limit = 10, fondoId, socioId } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (fondoId) where.fondoId = fondoId
    if (socioId) where.socioId = socioId
    if (search) {
      where.OR = [
        { socio: { nombres: { contains: search } } },
        { socio: { apellidoPaterno: { contains: search } } },
        { socio: { codigo: { contains: search } } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.cuentaAhorro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          socio: {
            select: { id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true },
          },
          fondo: {
            select: { id: true, nombre: true, moneda: true },
          },
          _count: { select: { movimientos: true } },
        },
      }),
      prisma.cuentaAhorro.count({ where }),
    ])

    return {
      data: data.map((c) => ({
        ...c,
        saldo: Number(c.saldo),
        totalMovimientos: c._count.movimientos,
        _count: undefined,
      })),
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
        socio: {
          select: { id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true },
        },
        fondo: {
          select: { id: true, nombre: true, moneda: true },
        },
      },
    })
    if (!cuenta) return null

    const [movimientos, totalMovimientos] = await Promise.all([
      prisma.ahorroMovimiento.findMany({
        where: { cuentaId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: movLimit,
        include: {
          registrador: { select: { id: true, nombres: true, apellidoPaterno: true } },
        },
      }),
      prisma.ahorroMovimiento.count({ where: { cuentaId: id } }),
    ])

    return {
      ...cuenta,
      saldo: Number(cuenta.saldo),
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
    const cuenta = await prisma.cuentaAhorro.findUnique({
      where: { fondoId_socioId: { fondoId, socioId } },
      include: {
        socio: {
          select: { id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true },
        },
        fondo: {
          select: { id: true, nombre: true, moneda: true },
        },
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!cuenta) return null
    return {
      ...cuenta,
      saldo: Number(cuenta.saldo),
      movimientos: cuenta.movimientos.map((m) => ({
        ...m,
        monto: Number(m.monto),
        saldoAntes: Number(m.saldoAntes),
        saldoDespues: Number(m.saldoDespues),
      })),
    }
  },

  async crearCuenta(data: { fondoId: number; socioId: number }) {
    const socioEnFondo = await prisma.fondoRotatorioSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
    })
    if (!socioEnFondo) throw new Error('El socio no pertenece a este fondo')

    const existente = await prisma.cuentaAhorro.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
    })
    if (existente) throw new Error('El socio ya tiene una cuenta de ahorro en este fondo')

    return prisma.cuentaAhorro.create({
      data: {
        saldo: 0,
        fondoId: data.fondoId,
        socioId: data.socioId,
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
    registradorId?: number
  }) {
    if (data.monto <= 0) throw new Error('El monto debe ser mayor a 0')

    const cuenta = await prisma.cuentaAhorro.findUnique({ where: { id: data.cuentaId } })
    if (!cuenta) throw new Error('Cuenta de ahorro no encontrada')
    if (cuenta.estado !== 'ACTIVA') throw new Error('La cuenta no está activa')

    const saldoActual = Number(cuenta.saldo)
    if (data.tipo === 'RETIRO' && data.monto > saldoActual) {
      throw new Error('Saldo insuficiente para el retiro')
    }

    const montoCambio = data.tipo === 'DEPOSITO' ? data.monto : -data.monto

    // TODO: Replace hardcoded registradorId with auth middleware
    const resolvedRegistradorId = data.registradorId || 1

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
          registradorId: resolvedRegistradorId,
        },
      })

      if (data.tipo === 'DEPOSITO') {
        await tx.fondoRotatorio.update({
          where: { id: cuenta.fondoId },
          data: { capitalDisponible: { increment: data.monto } },
        })
      } else {
        await tx.fondoRotatorio.update({
          where: { id: cuenta.fondoId },
          data: { capitalDisponible: { decrement: data.monto } },
        })
      }

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
              socio: { select: { id: true, codigo: true, nombres: true, apellidoPaterno: true } },
              fondo: { select: { id: true, nombre: true, moneda: true } },
            },
          },
          registrador: { select: { id: true, nombres: true, apellidoPaterno: true } },
        },
      }),
      prisma.ahorroMovimiento.count({ where }),
    ])

    return {
      data: data.map((m) => ({
        ...m,
        monto: Number(m.monto),
        saldoAntes: Number(m.saldoAntes),
        saldoDespues: Number(m.saldoDespues),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },
}
