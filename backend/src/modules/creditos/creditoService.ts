import prisma from '../../config/prisma'
import { HttpError } from '../../middeware/httpError'
import { createAuditLog } from '../../config/auditLog'
import { registrarMovimientoFondo } from '../caja/movimientoHelper'

const socioSelect = {
  id: true, codigo: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, dni: true,
} as const

const fondoSocioSelect = {
  id: true,
  fechaIngreso: true,
  socio: { select: socioSelect },
  fondo: { select: { id: true, nombre: true, moneda: true } },
} as const

const MAX_CUOTAS = 60
const MAX_TASA = 100
const ESTADOS_PRESTAMO = ['ACTIVO', 'PAGADO', 'ANULADO'] as const
const ESTADOS_CUOTA = ['PENDIENTE', 'VENCIDO', 'PAGADO', 'PARCIAL', 'ANULADO'] as const

function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function calcularAmortizacion(monto: number, tasaInteres: number, numeroCuotas: number) {
  const i = tasaInteres / 100
  const n = numeroCuotas
  const montoCuota = i > 0
    ? (monto * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
    : monto / n
  const totalInteres = montoCuota * n - monto
  return { montoCuota, totalInteres }
}

function generarCuotas(p: {
  fechaPrimerVencimiento: Date
  tasaInteres: number
  monto: number
  numeroCuotas: number
  montoCuota: number
}) {
  const i = p.tasaInteres / 100
  const montoC = round2(p.montoCuota)
  const cuotasData: any[] = []
  let saldoRestante = p.monto
  for (let idx = 1; idx <= p.numeroCuotas; idx++) {
    const fechaVenc = new Date(p.fechaPrimerVencimiento)
    fechaVenc.setMonth(fechaVenc.getMonth() + (idx - 1))
    const interesCuota = round2(saldoRestante * i)
    const esUltima = idx === p.numeroCuotas
    // La última cuota absorbe la diferencia de redondeo para que la suma
    // de amortizaciones sea exactamente igual al monto desembolsado.
    const amortizacionCuota = esUltima ? round2(saldoRestante) : round2(montoC - interesCuota)
    const montoCuotaReal = round2(amortizacionCuota + interesCuota)
    saldoRestante = round2(saldoRestante - amortizacionCuota)

    cuotasData.push({
      numero: idx,
      fechaVencimiento: fechaVenc,
      monto: montoCuotaReal,
      interes: interesCuota,
      amortizacion: amortizacionCuota,
      saldo: Math.max(saldoRestante, 0),
      montoPagado: 0,
      saldoPendiente: montoCuotaReal,
      estado: 'PENDIENTE',
    })
  }
  return cuotasData
}

/** Marca como VENCIDO las cuotas pendientes o parciales cuya fecha ya pasó. */
export async function marcarCuotasVencidas() {
  const hoy = inicioDelDia(new Date())
  const result = await prisma.cuotaPrestamo.updateMany({
    where: {
      fechaVencimiento: { lt: hoy },
      estado: { in: ['PENDIENTE', 'PARCIAL'] },
      prestamo: { estado: 'ACTIVO' },
    },
    data: { estado: 'VENCIDO' },
  })
  return result.count
}

function serializePrestamo(p: any) {
  const { fondoSocio, ...rest } = p
  return {
    ...rest,
    monto: Number(p.monto),
    tasaInteres: Number(p.tasaInteres),
    montoCuota: Number(p.montoCuota),
    totalInteres: Number(p.totalInteres),
    socio: fondoSocio?.socio ?? null,
    fondo: fondoSocio?.fondo ?? null,
  }
}

function serializeCuota(c: any) {
  return {
    ...c,
    monto: Number(c.monto),
    interes: Number(c.interes),
    amortizacion: Number(c.amortizacion),
    saldo: Number(c.saldo),
    montoPagado: Number(c.montoPagado),
    saldoPendiente: Number(c.saldoPendiente),
  }
}

export const creditoService = {
  async list(params: { search?: string; page?: number; limit?: number; fondoId?: number; socioId?: number; estado?: string }) {
    const { search, page = 1, limit = 10, fondoId, socioId, estado } = params
    const skip = (page - 1) * limit

    if (estado && !(ESTADOS_PRESTAMO as readonly string[]).includes(estado)) {
      throw new HttpError(400, 'Estado inválido. Debe ser ACTIVO, PAGADO o ANULADO')
    }

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

    const [data, total, aggregates, activosData] = await Promise.all([
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
      prisma.prestamo.findMany({
        where: { ...where, estado: 'ACTIVO' },
        select: {
          monto: true,
          fondoSocio: { select: { fondo: { select: { moneda: true } } } },
        },
      }),
    ])

    const totalPrestadoPorMoneda: Record<string, number> = {}
    for (const p of activosData) {
      const moneda = p.fondoSocio?.fondo?.moneda || 'PEN'
      totalPrestadoPorMoneda[moneda] = (totalPrestadoPorMoneda[moneda] || 0) + Number(p.monto)
    }

    return {
      data: data.map((p) => {
        const base = serializePrestamo(p)
        return {
          ...base,
          _count: undefined,
          totalCuotas: p._count.cuotas,
        }
      }),
      total,
      totalPrestado: Number(aggregates._sum.monto || 0),
      totalPrestadoPorMoneda,
      totalActivos: activosData.length,
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

    const base = serializePrestamo(prestamo)
    return {
      ...base,
      cuotas: prestamo.cuotas.map(serializeCuota),
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
      ...serializePrestamo(p),
      cuotas: p.cuotas.map(serializeCuota),
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
    if (data.monto <= 0) throw new HttpError(400, 'El monto debe ser mayor a 0')
    if (data.numeroCuotas < 1 || data.numeroCuotas > MAX_CUOTAS) {
      throw new HttpError(400, `El número de cuotas debe estar entre 1 y ${MAX_CUOTAS}`)
    }
    if (data.tasaInteres < 0 || data.tasaInteres > MAX_TASA) {
      throw new HttpError(400, `La tasa de interés debe estar entre 0 y ${MAX_TASA}%`)
    }

    const fechaPrimerVencimiento = new Date(data.fechaPrimerVencimiento)
    if (isNaN(fechaPrimerVencimiento.getTime())) throw new HttpError(400, 'Fecha de primer vencimiento inválida')
    if (inicioDelDia(fechaPrimerVencimiento) < inicioDelDia(new Date())) {
      throw new HttpError(400, 'La fecha del primer vencimiento no puede ser anterior a hoy')
    }

    const socioEnFondo = await prisma.fondoSocio.findUnique({
      where: { fondoId_socioId: { fondoId: data.fondoId, socioId: data.socioId } },
      include: { fondo: true },
    })
    if (!socioEnFondo) throw new HttpError(400, 'El socio no pertenece a este fondo')
    if (socioEnFondo.fechaSalida) throw new HttpError(400, 'El socio no está activo en este fondo')
    if (socioEnFondo.fondo.estado !== 'ACTIVO') throw new HttpError(400, 'El fondo no está activo')

    // Regla de sobreendeudamiento: no otorgar un nuevo crédito si el socio tiene uno activo.
    const prestamoActivoExistente = await prisma.prestamo.findFirst({
      where: {
        estado: 'ACTIVO',
        fondoSocio: { socioId: data.socioId },
      },
      select: { id: true },
    })
    if (prestamoActivoExistente) {
      throw new HttpError(400, 'El socio ya tiene un crédito activo. Debe regularizarlo antes de solicitar otro.')
    }

    if (Number(socioEnFondo.fondo.capitalDisponible) < data.monto) {
      throw new HttpError(400, 'El fondo no tiene capital disponible suficiente')
    }

    const { montoCuota } = calcularAmortizacion(data.monto, data.tasaInteres, data.numeroCuotas)
    const montoCuotaRedondeado = round2(montoCuota)
    const cuotasData = generarCuotas({
      fechaPrimerVencimiento,
      tasaInteres: data.tasaInteres,
      monto: data.monto,
      numeroCuotas: data.numeroCuotas,
      montoCuota: montoCuotaRedondeado,
    })
    const totalInteres = round2(cuotasData.reduce((a, c) => a + Number(c.interes), 0))

    const prestamo = await prisma.$transaction(async (tx) => {
      // Decremento atómico del capital para evitar sobregirar el fondo (race condition).
      const decrementado = await tx.fondoRotatorio.updateMany({
        where: { id: socioEnFondo.fondoId, capitalDisponible: { gte: data.monto } },
        data: { capitalDisponible: { decrement: data.monto } },
      })
      if (decrementado.count === 0) {
        throw new HttpError(400, 'El fondo no tiene capital disponible suficiente')
      }

      const p = await tx.prestamo.create({
        data: {
          monto: data.monto,
          tasaInteres: data.tasaInteres,
          numeroCuotas: data.numeroCuotas,
          montoCuota: montoCuotaRedondeado,
          totalInteres,
          fechaPrimerVencimiento,
          estado: 'ACTIVO',
          fondoSocioId: socioEnFondo.id,
        },
      })

      await tx.cuotaPrestamo.createMany({
        data: cuotasData.map((cuota) => ({ ...cuota, prestamoId: p.id })),
      })

      // Movimiento de caja: desembolso (salida de efectivo).
      await registrarMovimientoFondo(tx, socioEnFondo.fondoId, 'ING-PRESTAMO', {
        tipo: 'EGRESO',
        monto: data.monto,
        descripcion: `Desembolso de préstamo #${p.id}`,
        referencia: `PRESTAMO-${p.id}`,
      })

      return p
    })

    await createAuditLog({
      tabla: 'Prestamo',
      registroId: prestamo.id,
      operacion: 'CREATE',
      datosNuevos: {
        monto: Number(prestamo.monto),
        tasaInteres: Number(prestamo.tasaInteres),
        numeroCuotas: prestamo.numeroCuotas,
        fondoId: data.fondoId,
        socioId: data.socioId,
      },
    })

    return serializePrestamo(prestamo)
  },

  async actualizar(
    id: number,
    data: Partial<{
      monto: number
      tasaInteres: number
      numeroCuotas: number
      fechaPrimerVencimiento: string
    }>,
  ) {
    const prestamo = await prisma.prestamo.findUnique({
      where: { id },
      include: {
        cuotas: true,
        fondoSocio: { select: { fondoId: true } },
      },
    })
    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')
    if (prestamo.estado !== 'ACTIVO') throw new HttpError(400, 'Solo se puede modificar un préstamo activo')

    const tienePagos = prestamo.cuotas.some((c) => Number(c.montoPagado) > 0)
    if (tienePagos) throw new HttpError(400, 'No se puede modificar un préstamo con cuotas pagadas')

    const monto = data.monto !== undefined ? Number(data.monto) : Number(prestamo.monto)
    const tasaInteres = data.tasaInteres !== undefined ? Number(data.tasaInteres) : Number(prestamo.tasaInteres)
    const numeroCuotas = data.numeroCuotas !== undefined ? Number(data.numeroCuotas) : prestamo.numeroCuotas
    const fechaPrimerVencimiento = data.fechaPrimerVencimiento
      ? new Date(data.fechaPrimerVencimiento)
      : prestamo.fechaPrimerVencimiento

    if (monto <= 0) throw new HttpError(400, 'El monto debe ser mayor a 0')
    if (numeroCuotas < 1 || numeroCuotas > MAX_CUOTAS) {
      throw new HttpError(400, `El número de cuotas debe estar entre 1 y ${MAX_CUOTAS}`)
    }
    if (tasaInteres < 0 || tasaInteres > MAX_TASA) {
      throw new HttpError(400, `La tasa de interés debe estar entre 0 y ${MAX_TASA}%`)
    }
    if (isNaN(fechaPrimerVencimiento.getTime())) throw new HttpError(400, 'Fecha de primer vencimiento inválida')
    if (inicioDelDia(fechaPrimerVencimiento) < inicioDelDia(new Date())) {
      throw new HttpError(400, 'La fecha del primer vencimiento no puede ser anterior a hoy')
    }

    const { montoCuota } = calcularAmortizacion(monto, tasaInteres, numeroCuotas)
    const montoCuotaRedondeado = round2(montoCuota)
    const cuotasData = generarCuotas({
      fechaPrimerVencimiento,
      tasaInteres,
      monto,
      numeroCuotas,
      montoCuota: montoCuotaRedondeado,
    })
    const totalInteres = round2(cuotasData.reduce((a, c) => a + Number(c.interes), 0))
    const delta = monto - Number(prestamo.monto)

    const updated = await prisma.$transaction(async (tx) => {
      if (delta > 0) {
        const ok = await tx.fondoRotatorio.updateMany({
          where: { id: prestamo.fondoSocio.fondoId, capitalDisponible: { gte: delta } },
          data: { capitalDisponible: { decrement: delta } },
        })
        if (ok.count === 0) {
          throw new HttpError(400, 'El fondo no tiene capital disponible suficiente para el nuevo monto')
        }
      } else if (delta < 0) {
        await tx.fondoRotatorio.update({
          where: { id: prestamo.fondoSocio.fondoId },
          data: { capitalDisponible: { increment: -delta } },
        })
      }

      const p = await tx.prestamo.update({
        where: { id },
        data: {
          monto,
          tasaInteres,
          numeroCuotas,
          montoCuota: montoCuotaRedondeado,
          totalInteres,
          fechaPrimerVencimiento,
        },
      })

      await tx.cuotaPrestamo.deleteMany({ where: { prestamoId: id } })
      await tx.cuotaPrestamo.createMany({
        data: cuotasData.map((cuota) => ({ ...cuota, prestamoId: id })),
      })

      // Movimiento de caja compensatorio por el cambio de monto.
      if (delta > 0) {
        await registrarMovimientoFondo(tx, prestamo.fondoSocio.fondoId, 'ING-PRESTAMO', {
          tipo: 'EGRESO',
          monto: delta,
          descripcion: `Ajuste de desembolso de préstamo #${id}`,
          referencia: `PRESTAMO-${id}`,
        })
      } else if (delta < 0) {
        await registrarMovimientoFondo(tx, prestamo.fondoSocio.fondoId, 'ING-CUOTA', {
          tipo: 'INGRESO',
          monto: -delta,
          descripcion: `Ajuste de desembolso de préstamo #${id} (reducción)`,
          referencia: `PRESTAMO-${id}`,
        })
      }

      return p
    })

    await createAuditLog({
      tabla: 'Prestamo',
      registroId: id,
      operacion: 'UPDATE',
      datosAnteriores: {
        monto: Number(prestamo.monto),
        tasaInteres: Number(prestamo.tasaInteres),
        numeroCuotas: prestamo.numeroCuotas,
        fechaPrimerVencimiento: prestamo.fechaPrimerVencimiento,
      },
      datosNuevos: { monto, tasaInteres, numeroCuotas, fechaPrimerVencimiento },
    })

    return serializePrestamo(updated)
  },

  async pagarCuota(data: {
    cuotaId: number
    monto: number
    fechaPago?: string
    metodoPago: string
    comprobante?: string | null
  }) {
    if (data.monto <= 0) throw new HttpError(400, 'El monto debe ser mayor a 0')
    if (!['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'].includes(data.metodoPago)) {
      throw new HttpError(400, 'Método de pago inválido')
    }

    await marcarCuotasVencidas()

    const cuota = await prisma.cuotaPrestamo.findUnique({
      where: { id: data.cuotaId },
      include: {
        prestamo: {
          include: {
            fondoSocio: { select: { fondoId: true } },
            cuotas: { orderBy: { numero: 'asc' } },
          },
        },
      },
    })
    if (!cuota) throw new HttpError(404, 'Cuota no encontrada')
    if (cuota.estado === 'PAGADO') throw new HttpError(400, 'La cuota ya está pagada')
    if (cuota.estado === 'ANULADO') throw new HttpError(400, 'La cuota está anulada')
    if (cuota.prestamo.estado !== 'ACTIVO') throw new HttpError(400, 'El préstamo no está activo')

    // Orden de pago: primero la cuota impaga más antigua.
    const primeraImpaga = cuota.prestamo.cuotas.find((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO')
    if (!primeraImpaga) throw new HttpError(400, 'No hay cuotas pendientes por pagar')
    if (primeraImpaga.id !== cuota.id) {
      throw new HttpError(400, `Debe pagar primero la cuota ${primeraImpaga.numero} (${primeraImpaga.fechaVencimiento.toISOString().slice(0, 10)})`)
    }

    // Separar el pago en capital (amortización) e interés de forma proporcional.
    const cuotaMonto = Number(cuota.monto)
    const cuotaInteres = Number(cuota.interes)
    const proporcionInteres = cuotaMonto > 0 ? cuotaInteres / cuotaMonto : 0
    const interesPagado = round2(data.monto * proporcionInteres)
    const capitalPagado = round2(data.monto - interesPagado)

    const result = await prisma.$transaction(async (tx) => {
      // Re-lectura dentro de la transacción para evitar pagos concurrentes
      // sobre el mismo saldo pendiente (race condition).
      const cuotaActual = await tx.cuotaPrestamo.findUnique({ where: { id: data.cuotaId } })
      if (!cuotaActual) throw new HttpError(404, 'Cuota no encontrada')
      if (cuotaActual.estado === 'PAGADO' || cuotaActual.estado === 'ANULADO') {
        throw new HttpError(400, 'La cuota no está pendiente de pago')
      }
      if (data.monto > Number(cuotaActual.saldoPendiente)) {
        throw new HttpError(400, 'El monto excede el saldo pendiente de la cuota')
      }

      const esPagoCompleto = data.monto >= Number(cuotaActual.saldoPendiente)
      const updated = await tx.cuotaPrestamo.update({
        where: { id: data.cuotaId },
        data: {
          montoPagado: { increment: data.monto },
          saldoPendiente: { decrement: data.monto },
          fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || null,
          estado: esPagoCompleto ? 'PAGADO' : 'PARCIAL',
        },
      })

      // El capital disponible recupera solo la parte de amortización (no el interés).
      if (capitalPagado > 0) {
        await tx.fondoRotatorio.update({
          where: { id: cuota.prestamo.fondoSocio.fondoId },
          data: { capitalDisponible: { increment: capitalPagado } },
        })
      }

      // Verificar si todas las cuotas están pagadas.
      const pendientes = await tx.cuotaPrestamo.count({
        where: { prestamoId: cuota.prestamoId, estado: { notIn: ['PAGADO'] } },
      })
      if (pendientes === 0) {
        await tx.prestamo.update({
          where: { id: cuota.prestamoId },
          data: { estado: 'PAGADO' },
        })
      }

      // Movimientos de caja: el capital y el interés se registran por separado.
      if (capitalPagado > 0) {
        await registrarMovimientoFondo(tx, cuota.prestamo.fondoSocio.fondoId, 'ING-CUOTA', {
          tipo: 'INGRESO',
          monto: capitalPagado,
          descripcion: `Pago de cuota ${cuota.numero} del préstamo #${cuota.prestamoId} (capital)`,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || undefined,
          referencia: `CUOTA-${cuota.id}`,
        })
      }
      if (interesPagado > 0) {
        await registrarMovimientoFondo(tx, cuota.prestamo.fondoSocio.fondoId, 'ING-INTERES', {
          tipo: 'INGRESO',
          monto: interesPagado,
          descripcion: `Pago de cuota ${cuota.numero} del préstamo #${cuota.prestamoId} (intereses)`,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || undefined,
          referencia: `CUOTA-${cuota.id}`,
        })
      }

      return updated
    })

    await createAuditLog({
      tabla: 'CuotaPrestamo',
      registroId: cuota.id,
      operacion: 'PAYMENT',
      datosNuevos: {
        prestamoId: cuota.prestamoId,
        monto: data.monto,
        interes: interesPagado,
        capital: capitalPagado,
        metodoPago: data.metodoPago,
        comprobante: data.comprobante || null,
      },
    })

    return {
      ...serializeCuota(result),
      interesPagado,
      capitalPagado,
    }
  },

  async liquidar(prestamoId: number, data: { fechaPago?: string; metodoPago: string; comprobante?: string | null }) {
    if (!['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'].includes(data.metodoPago)) {
      throw new HttpError(400, 'Método de pago inválido')
    }

    const prestamo = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: {
        cuotas: { orderBy: { numero: 'asc' } },
        fondoSocio: { select: { fondoId: true } },
      },
    })
    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')
    if (prestamo.estado !== 'ACTIVO') throw new HttpError(400, 'Solo se puede liquidar un préstamo activo')

    const pendientes = prestamo.cuotas.filter((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO')
    if (pendientes.length === 0) throw new HttpError(400, 'El préstamo no tiene cuotas pendientes')

    let capitalTotal = 0
    let interesTotal = 0
    for (const c of pendientes) {
      const cMonto = Number(c.monto)
      const cInteres = Number(c.interes)
      const proporcion = cMonto > 0 ? cInteres / cMonto : 0
      const pendiente = Number(c.saldoPendiente)
      const iPart = round2(pendiente * proporcion)
      capitalTotal += round2(pendiente - iPart)
      interesTotal += iPart
    }
    capitalTotal = round2(capitalTotal)
    interesTotal = round2(interesTotal)
    const fechaPago = data.fechaPago ? new Date(data.fechaPago) : new Date()

    await prisma.$transaction(async (tx) => {
      for (const c of pendientes) {
        await tx.cuotaPrestamo.update({
          where: { id: c.id },
          data: {
            montoPagado: { increment: Number(c.saldoPendiente) },
            saldoPendiente: 0,
            fechaPago,
            metodoPago: data.metodoPago,
            comprobante: data.comprobante || null,
            estado: 'PAGADO',
          },
        })
      }

      if (capitalTotal > 0) {
        await tx.fondoRotatorio.update({
          where: { id: prestamo.fondoSocio.fondoId },
          data: { capitalDisponible: { increment: capitalTotal } },
        })
      }

      await tx.prestamo.update({
        where: { id: prestamoId },
        data: { estado: 'PAGADO' },
      })

      if (capitalTotal > 0) {
        await registrarMovimientoFondo(tx, prestamo.fondoSocio.fondoId, 'ING-CUOTA', {
          tipo: 'INGRESO',
          monto: capitalTotal,
          descripcion: `Liquidación total de préstamo #${prestamoId} (capital)`,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || undefined,
          referencia: `PRESTAMO-${prestamoId}`,
        })
      }
      if (interesTotal > 0) {
        await registrarMovimientoFondo(tx, prestamo.fondoSocio.fondoId, 'ING-INTERES', {
          tipo: 'INGRESO',
          monto: interesTotal,
          descripcion: `Liquidación total de préstamo #${prestamoId} (intereses)`,
          metodoPago: data.metodoPago,
          comprobante: data.comprobante || undefined,
          referencia: `PRESTAMO-${prestamoId}`,
        })
      }
    })

    await createAuditLog({
      tabla: 'Prestamo',
      registroId: prestamoId,
      operacion: 'LIQUIDAR',
      datosNuevos: { capital: capitalTotal, interes: interesTotal, fechaPago },
    })

    return {
      success: true,
      total: round2(capitalTotal + interesTotal),
      capital: capitalTotal,
      interes: interesTotal,
    }
  },

  async anular(id: number) {
    const prestamo = await prisma.prestamo.findUnique({
      where: { id },
      include: { cuotas: true, fondoSocio: { select: { fondoId: true } } },
    })
    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')
    if (prestamo.estado === 'ANULADO') throw new HttpError(400, 'El préstamo ya está anulado')

    const cuotasPagadas = prestamo.cuotas.some((c) => Number(c.montoPagado) > 0)
    if (cuotasPagadas) throw new HttpError(400, 'No se puede anular un préstamo con cuotas pagadas')

    await prisma.$transaction(async (tx) => {
      await tx.fondoRotatorio.update({
        where: { id: prestamo.fondoSocio.fondoId },
        data: { capitalDisponible: { increment: Number(prestamo.monto) } },
      })

      await tx.cuotaPrestamo.updateMany({
        where: { prestamoId: id },
        data: { estado: 'ANULADO', saldoPendiente: 0 },
      })

      await tx.prestamo.update({
        where: { id },
        data: { estado: 'ANULADO' },
      })

      // Devolución del desembolso a la caja.
      await registrarMovimientoFondo(tx, prestamo.fondoSocio.fondoId, 'ING-REINTEGRO', {
        tipo: 'INGRESO',
        monto: Number(prestamo.monto),
        descripcion: `Anulación de préstamo #${id}: devolución del desembolso`,
        referencia: `PRESTAMO-${id}`,
      })
    })

    await createAuditLog({
      tabla: 'Prestamo',
      registroId: id,
      operacion: 'ANULAR',
      datosAnteriores: { estado: prestamo.estado },
      datosNuevos: { estado: 'ANULADO' },
    })

    return { success: true }
  },
}
