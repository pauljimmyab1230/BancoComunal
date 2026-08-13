import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { generateCodigo } from './movimientoHelper'

export const cajaService = {
  // Cajas
  async list(params: { search?: string; page?: number; limit?: number; estado?: string; tipo?: string; fondoId?: number }) {
    const { search, page = 1, limit = 10, estado, tipo, fondoId } = params
    if (page < 1 || limit < 1) {
      throw new HttpError(400, 'Parámetros de paginación inválidos')
    }
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (fondoId) where.fondoId = fondoId
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.caja.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fondo: { select: { id: true, nombre: true, moneda: true } },
          _count: { select: { movimientos: true, arqueos: true } },
        },
      }),
      prisma.caja.count({ where }),
    ])

    return {
      data: data.map((c) => ({
        ...c,
        saldoInicial: Number(c.saldoInicial),
        saldoActual: Number(c.saldoActual),
        totalMovimientos: c._count.movimientos,
        totalArqueos: c._count.arqueos,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const caja = await prisma.caja.findUnique({
      where: { id },
      include: {
        fondo: { select: { id: true, nombre: true, moneda: true } },
        movimientos: {
          take: 20,
          orderBy: { fechaMovimiento: 'desc' },
          include: {
            concepto: true,
          },
        },
        arqueos: {
          take: 10,
          orderBy: { fechaArqueo: 'desc' },
        },
        flujoProyectados: {
          where: { fecha: { gte: new Date() } },
          orderBy: { fecha: 'asc' },
          take: 30,
        },
      },
    })

    if (!caja) return null

    return {
      ...caja,
      saldoInicial: Number(caja.saldoInicial),
      saldoActual: Number(caja.saldoActual),
      movimientos: caja.movimientos.map((m) => ({
        ...m,
        monto: Number(m.monto),
      })),
      arqueos: caja.arqueos.map((a) => ({
        ...a,
        saldoSistema: Number(a.saldoSistema),
        saldoFisico: Number(a.saldoFisico),
        diferencia: Number(a.diferencia),
      })),
    }
  },

  async create(data: any) {
    if (!data.fondoId) throw new HttpError(400, 'La caja debe pertenecer a un fondo rotatorio')

    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: data.fondoId } })
    if (!fondo) throw new HttpError(400, 'Fondo no encontrado')
    if (fondo.estado !== 'ACTIVO') throw new HttpError(400, 'El fondo no está activo')
    if (data.moneda && fondo.moneda && data.moneda !== fondo.moneda) {
      throw new HttpError(400, `La moneda de la caja debe coincidir con la del fondo (${fondo.moneda})`)
    }

    let codigo = generateCodigo('CAJ-')
    let exists = await prisma.caja.findUnique({ where: { codigo } })
    while (exists) {
      codigo = generateCodigo('CAJ-')
      exists = await prisma.caja.findUnique({ where: { codigo } })
    }

    const caja = await prisma.caja.create({
      data: {
        codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        moneda: data.moneda,
        saldoInicial: data.saldoInicial || 0,
        saldoActual: data.saldoInicial || 0,
        fondoId: data.fondoId,
        estado: data.estado || 'ACTIVA',
      },
      include: { fondo: { select: { id: true, nombre: true } } },
    })

    await this.crearConceptosPorDefecto()
    return caja
  },

  async crearConceptosPorDefecto() {
    const conceptos = [
      { codigo: 'ING-APORTE', nombre: 'Aporte de Socio', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 1 },
      { codigo: 'ING-PRESTAMO', nombre: 'Desembolso Préstamo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 3 },
      { codigo: 'ING-CUOTA', nombre: 'Pago Cuota Préstamo', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 4 },
      { codigo: 'ING-REINTEGRO', nombre: 'Reintegro Préstamo Anulado', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 5 },
      { codigo: 'ING-INTERES', nombre: 'Interés Cobrado', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 6 },
      { codigo: 'ING-OTRO', nombre: 'Otros Ingresos', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 7 },
      { codigo: 'EGR-GASTO', nombre: 'Gasto Operativo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 11 },
      { codigo: 'EGR-PROVISION', nombre: 'Provisión Fondo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 12 },
      { codigo: 'EGR-OTRO', nombre: 'Otros Egresos', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 13 },
      { codigo: 'TRF-ENTRE-CAJAS', nombre: 'Transferencia Entre Cajas', tipo: 'TRANSFERENCIA', afectaSaldo: 'NO_AFECTA', orden: 20 },
      { codigo: 'TRF-SALIDA-CAJAS', nombre: 'Transferencia Entre Cajas (Salida)', tipo: 'TRANSFERENCIA', afectaSaldo: 'DISMINUYE', orden: 20 },
      { codigo: 'TRF-ENTRADA-CAJAS', nombre: 'Transferencia Entre Cajas (Entrada)', tipo: 'TRANSFERENCIA', afectaSaldo: 'AUMENTA', orden: 20 },
      { codigo: 'AJU-DIF-SOBRANTE', nombre: 'Ajuste por Sobrante de Arqueo', tipo: 'AJUSTE', afectaSaldo: 'AUMENTA', orden: 21 },
      { codigo: 'AJU-DIF-FALTANTE', nombre: 'Ajuste por Faltante de Arqueo', tipo: 'AJUSTE', afectaSaldo: 'DISMINUYE', orden: 22 },
      { codigo: 'AJU-APERTURA', nombre: 'Ajuste de Apertura / Reconciliación', tipo: 'AJUSTE', afectaSaldo: 'AUMENTA', orden: 23 },
    ]

    for (const c of conceptos) {
      await prisma.conceptoCaja.upsert({
        where: { codigo: c.codigo },
        // Repara los conceptos de sistema en cada arranque.
        update: { nombre: c.nombre, tipo: c.tipo, afectaSaldo: c.afectaSaldo, requiereComprobante: true, estado: 'ACTIVO' },
        create: { ...c, requiereComprobante: true, estado: 'ACTIVO' },
      })
    }
  },

  async update(id: number, data: any) {
    const existing = await prisma.caja.findUnique({ where: { id } })
    if (!existing) return null

    const updateData: any = {}
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.moneda !== undefined) updateData.moneda = data.moneda
    if (data.fondoId !== undefined) {
      const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: Number(data.fondoId) } })
      if (!fondo) throw new HttpError(400, 'Fondo no encontrado')
      if (fondo.estado !== 'ACTIVO') throw new HttpError(400, 'El fondo no está activo')
      updateData.fondoId = Number(data.fondoId)
    }
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.saldoInicial !== undefined) {
      const nuevoSaldoInicial = Number(data.saldoInicial)
      if (isNaN(nuevoSaldoInicial) || nuevoSaldoInicial < 0) {
        throw new HttpError(400, 'El saldo inicial no puede ser negativo')
      }
      const delta = nuevoSaldoInicial - Number(existing.saldoInicial)
      if (delta !== 0 && Number(existing.saldoActual) + delta < 0) {
        throw new HttpError(400, 'El nuevo saldo inicial haría que el saldo actual sea negativo')
      }
      updateData.saldoInicial = nuevoSaldoInicial
      if (delta !== 0) {
        updateData.saldoActual = { increment: delta }
      }
    }

    const monedaFinal = data.moneda ?? existing.moneda
    const fondoIdFinal = data.fondoId !== undefined ? Number(data.fondoId) : existing.fondoId
    if (data.fondoId !== undefined || data.moneda !== undefined) {
      const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: fondoIdFinal } })
      if (fondo?.moneda && monedaFinal && monedaFinal !== fondo.moneda) {
        throw new HttpError(400, `La moneda de la caja debe coincidir con la del fondo (${fondo.moneda})`)
      }
      const movimientosCount = await prisma.movimientoCaja.count({ where: { cajaId: id, estado: { not: 'ANULADO' } } })
      if (movimientosCount > 0 && data.moneda !== undefined && data.moneda !== existing.moneda) {
        throw new HttpError(400, 'No se puede cambiar la moneda de una caja con movimientos registrados')
      }
      if (movimientosCount > 0 && data.fondoId !== undefined && Number(data.fondoId) !== existing.fondoId) {
        throw new HttpError(400, 'No se puede cambiar el fondo de una caja con movimientos registrados')
      }
    }

    return prisma.caja.update({ where: { id }, data: updateData, include: { fondo: { select: { id: true, nombre: true } } } })
  },

  async delete(id: number) {
    const caja = await prisma.caja.findUnique({ where: { id } })
    if (!caja) return false

    const [movimientosCount, arqueosCount, flujoCount] = await Promise.all([
      prisma.movimientoCaja.count({ where: { cajaId: id } }),
      prisma.arqueoCaja.count({ where: { cajaId: id } }),
      prisma.flujoCajaProyectado.count({ where: { cajaId: id } }),
    ])

    if (movimientosCount > 0 || arqueosCount > 0 || flujoCount > 0) {
      return 'No se puede eliminar: la caja tiene movimientos, arqueos o flujo proyectado registrados. Inactive la caja en su lugar.'
    }

    await prisma.caja.delete({ where: { id } })
    return true
  },

  // Conceptos
  async listConceptos(params?: { estado?: string; tipo?: string }) {
    const where: any = {}
    if (params?.estado) where.estado = params.estado
    if (params?.tipo) where.tipo = params.tipo
    return prisma.conceptoCaja.findMany({ where, orderBy: { orden: 'asc' } })
  },

  async getConceptoById(id: number) {
    return prisma.conceptoCaja.findUnique({ where: { id } })
  },

  async createConcepto(data: any) {
    return prisma.conceptoCaja.create({ data })
  },

  async updateConcepto(id: number, data: any) {
    const existing = await prisma.conceptoCaja.findUnique({ where: { id } })
    if (!existing) return null

    const movimientosCount = await prisma.movimientoCaja.count({ where: { conceptoId: id } })
    if (movimientosCount > 0) {
      const protectedFields = ['codigo', 'tipo', 'afectaSaldo']
      for (const field of protectedFields) {
        if (data[field] !== undefined && data[field] !== (existing as any)[field]) {
          throw new HttpError(400, `No se puede modificar ${field}: el concepto ya tiene movimientos registrados`)
        }
      }
    }

    return prisma.conceptoCaja.update({ where: { id }, data })
  },

  async deleteConcepto(id: number) {
    const existing = await prisma.conceptoCaja.findUnique({ where: { id } })
    if (!existing) return false

    const movimientosCount = await prisma.movimientoCaja.count({ where: { conceptoId: id } })
    if (movimientosCount > 0) {
      throw new HttpError(400, 'No se puede eliminar: el concepto tiene movimientos registrados')
    }

    await prisma.conceptoCaja.delete({ where: { id } })
    return true
  },

  // Movimientos
  async listMovimientos(params: {
    cajaId?: number; conceptoId?: number; tipo?: string; estado?: string;
    fechaInicio?: string; fechaFin?: string; page?: number; limit?: number
  }) {
    const { cajaId, conceptoId, tipo, estado, fechaInicio, fechaFin, page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (cajaId) where.cajaId = cajaId
    if (conceptoId) where.conceptoId = conceptoId
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {}
      if (fechaInicio) where.fechaMovimiento.gte = new Date(fechaInicio)
      if (fechaFin) where.fechaMovimiento.lte = new Date(fechaFin)
    }

    const [data, total] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where, skip, take: limit,
        orderBy: { fechaMovimiento: 'desc' },
        include: {
          caja: { select: { id: true, codigo: true, nombre: true } },
          concepto: { select: { id: true, codigo: true, nombre: true, tipo: true } },
        },
      }),
      prisma.movimientoCaja.count({ where }),
    ])

    return {
      data: data.map((m) => ({ ...m, monto: Number(m.monto) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getMovimientoById(id: number) {
    return prisma.movimientoCaja.findUnique({
      where: { id },
      include: { caja: true, concepto: true },
    })
  },

  async createMovimiento(data: any) {
    const caja = await prisma.caja.findUnique({ where: { id: data.cajaId } })
    if (!caja) throw new HttpError(400, 'Caja no encontrada')
    if (caja.estado !== 'ACTIVA') throw new HttpError(400, 'La caja no está activa')

    const concepto = await prisma.conceptoCaja.findUnique({ where: { id: data.conceptoId } })
    if (!concepto) throw new HttpError(400, 'Concepto no encontrado')
    if (concepto.estado !== 'ACTIVO') throw new HttpError(400, 'El concepto de caja no está activo')
    if (data.tipo !== concepto.tipo) {
      throw new HttpError(400, `El tipo del movimiento (${data.tipo}) no corresponde al concepto (${concepto.tipo})`)
    }
    if (concepto.requiereComprobante && !data.comprobante) {
      throw new HttpError(400, 'El concepto requiere número de comprobante')
    }

    let codigo = generateCodigo('MOV-')
    let exists = await prisma.movimientoCaja.findUnique({ where: { codigo } })
    while (exists) {
      codigo = generateCodigo('MOV-')
      exists = await prisma.movimientoCaja.findUnique({ where: { codigo } })
    }

    const fechaMovimiento = data.fechaMovimiento ? new Date(data.fechaMovimiento) : new Date()

    const movimiento = await prisma.$transaction(async (tx) => {
      // Cálculo del delta dentro de la transacción con actualización atómica
      // para evitar la pérdida de actualización del saldo (race condition).
      let delta = 0
      if (concepto.afectaSaldo === 'AUMENTA') delta = Number(data.monto)
      else if (concepto.afectaSaldo === 'DISMINUYE') delta = -Number(data.monto)

      if (delta < 0) {
        const ok = await tx.caja.updateMany({
          where: { id: data.cajaId, saldoActual: { gte: -delta } },
          data: { saldoActual: { increment: delta } },
        })
        if (ok.count === 0) {
          throw new HttpError(400, 'Saldo insuficiente en caja para realizar el movimiento')
        }
      } else if (delta > 0) {
        await tx.caja.update({
          where: { id: data.cajaId },
          data: { saldoActual: { increment: delta } },
        })
      }

      const mov = await tx.movimientoCaja.create({
        data: {
          codigo, tipo: data.tipo, monto: data.monto, descripcion: data.descripcion,
          comprobante: data.comprobante, metodoPago: data.metodoPago, referencia: data.referencia,
          fechaMovimiento, estado: 'REGISTRADO', cajaId: data.cajaId,
          conceptoId: data.conceptoId,
        },
        include: { caja: true, concepto: true },
      })
      return mov
    })

    return movimiento
  },

  async anularMovimiento(id: number) {
    const movimiento = await prisma.movimientoCaja.findUnique({
      where: { id }, include: { caja: true, concepto: true },
    })
    if (!movimiento) throw new HttpError(400, 'Movimiento no encontrado')
    if (movimiento.estado === 'ANULADO') throw new HttpError(400, 'Movimiento ya anulado')

    // Los movimientos vinculados a aportes, préstamos o cuotas se anulan desde
    // su propio módulo para revertir también el saldo del fondo (evita dobles anulaciones).
    if (movimiento.referencia && /^(APORTE-|PRESTAMO-|CUOTA-)/.test(movimiento.referencia)) {
      throw new HttpError(400, 'No se puede anular un movimiento vinculado desde caja; anúlelo desde su módulo (aporte o crédito)')
    }

    const caja = movimiento.caja
    const concepto = movimiento.concepto

    let delta = 0
    if (concepto?.afectaSaldo === 'AUMENTA') delta = -Number(movimiento.monto)
    else if (concepto?.afectaSaldo === 'DISMINUYE') delta = Number(movimiento.monto)

    await prisma.$transaction(async (tx) => {
      if (delta < 0) {
        const ok = await tx.caja.updateMany({
          where: { id: caja.id, saldoActual: { gte: -delta } },
          data: { saldoActual: { increment: delta } },
        })
        if (ok.count === 0) {
          throw new HttpError(400, 'No se puede anular: el saldo de la caja quedaría negativo')
        }
      } else if (delta !== 0) {
        await tx.caja.update({ where: { id: caja.id }, data: { saldoActual: { increment: delta } } })
      }
      await tx.movimientoCaja.update({ where: { id }, data: { estado: 'ANULADO' } })
    })

    return { success: true }
  },

  // Arqueos
  async listArqueos(params: { cajaId?: number; estado?: string; page?: number; limit?: number }) {
    const { cajaId, estado, page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (cajaId) where.cajaId = cajaId
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      prisma.arqueoCaja.findMany({
        where, skip, take: limit,
        orderBy: { fechaArqueo: 'desc' },
        include: {
          caja: { select: { id: true, codigo: true, nombre: true } },
        },
      }),
      prisma.arqueoCaja.count({ where }),
    ])

    return {
      data: data.map((a) => ({
        ...a,
        saldoSistema: Number(a.saldoSistema),
        saldoFisico: Number(a.saldoFisico),
        diferencia: Number(a.diferencia),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getArqueoById(id: number) {
    const arqueo = await prisma.arqueoCaja.findUnique({
      where: { id },
      include: { caja: true },
    })
    if (!arqueo) return null
    return {
      ...arqueo,
      saldoSistema: Number(arqueo.saldoSistema),
      saldoFisico: Number(arqueo.saldoFisico),
      diferencia: Number(arqueo.diferencia),
    }
  },

  async createArqueo(data: any) {
    const caja = await prisma.caja.findUnique({ where: { id: data.cajaId } })
    if (!caja) throw new HttpError(400, 'Caja no encontrada')
    if (caja.estado !== 'ACTIVA') throw new HttpError(400, 'La caja no está activa')

    const fechaArqueo = data.fechaArqueo ? new Date(data.fechaArqueo) : new Date()

    const movimientos = await prisma.movimientoCaja.findMany({
      where: { cajaId: data.cajaId, estado: { not: 'ANULADO' }, fechaMovimiento: { lte: fechaArqueo } },
      include: { concepto: true },
    })

    const saldoSistema = movimientos.reduce((acc, m) => {
      if (m.concepto?.afectaSaldo === 'AUMENTA') return acc + Number(m.monto)
      if (m.concepto?.afectaSaldo === 'DISMINUYE') return acc - Number(m.monto)
      return acc
    }, Number(caja.saldoInicial))

    const diferencia = Number(data.saldoFisico) - saldoSistema
    const codigo = generateCodigo('ARQ-')

    const arqueo = await prisma.arqueoCaja.create({
      data: {
        codigo, fechaArqueo, saldoSistema, saldoFisico: data.saldoFisico, diferencia,
        observacion: data.observacion, estado: 'PENDIENTE', cajaId: data.cajaId,
      },
      include: { caja: true },
    })

    return {
      ...arqueo,
      saldoSistema: Number(arqueo.saldoSistema),
      saldoFisico: Number(arqueo.saldoFisico),
      diferencia: Number(arqueo.diferencia),
    }
  },

  async aprobarArqueo(id: number, data: any, usuario?: string | null) {
    const arqueo = await prisma.arqueoCaja.findUnique({
      where: { id },
      include: { caja: true },
    })
    if (!arqueo) throw new HttpError(400, 'Arqueo no encontrado')
    if (arqueo.estado === 'APROBADO' || arqueo.estado === 'RECHAZADO') throw new HttpError(400, 'Arqueo ya procesado')

    const diferencia = Number(arqueo.diferencia)
    const esAprobado = data.estado === 'APROBADO'

    if (!esAprobado || diferencia === 0) {
      return prisma.arqueoCaja.update({
        where: { id },
        data: {
          estado: data.estado,
          // Solo los arqueos aprobados registran fecha de aprobación.
          fechaAprobacion: esAprobado ? new Date() : null,
          aprobadoPor: usuario || null,
          observacion: data.observacion || arqueo.observacion,
        },
        include: { caja: true },
      })
    }

    // Si hay diferencia y se aprueba, se cuadra el saldo de la caja al saldo físico
    // y se registra un movimiento de ajuste (AJUSTE) que deja trazabilidad.
    return prisma.$transaction(async (tx) => {
      const conceptoCodigo = diferencia > 0 ? 'AJU-DIF-SOBRANTE' : 'AJU-DIF-FALTANTE'
      const concepto = await tx.conceptoCaja.findUnique({ where: { codigo: conceptoCodigo } })
      if (!concepto) {
        throw new HttpError(400, `Concepto de ajuste ${conceptoCodigo} no configurado`)
      }

      let codigo = generateCodigo('MOV-')
      let exists = await tx.movimientoCaja.findUnique({ where: { codigo } })
      while (exists) {
        codigo = generateCodigo('MOV-')
        exists = await tx.movimientoCaja.findUnique({ where: { codigo } })
      }

      await tx.movimientoCaja.create({
        data: {
          codigo,
          tipo: 'AJUSTE',
          monto: Math.abs(diferencia),
          descripcion: `Ajuste por arqueo ${arqueo.codigo} (${diferencia > 0 ? 'sobrante' : 'faltante'})`,
          metodoPago: 'EFECTIVO',
          referencia: arqueo.codigo,
          fechaMovimiento: arqueo.fechaArqueo,
          estado: 'REGISTRADO',
          cajaId: arqueo.cajaId,
          conceptoId: concepto.id,
        },
      })

      await tx.caja.update({
        where: { id: arqueo.cajaId },
        data: { saldoActual: { increment: diferencia } },
      })

      return tx.arqueoCaja.update({
        where: { id },
        data: {
          estado: 'APROBADO',
          fechaAprobacion: new Date(),
          aprobadoPor: usuario || null,
          observacion: data.observacion || arqueo.observacion,
        },
        include: { caja: true },
      })
    })
  },

  // Transferencias entre cajas
  async transferir(data: { cajaOrigenId: number; cajaDestinoId: number; monto: number; descripcion?: string }) {
    if (data.cajaOrigenId === data.cajaDestinoId) {
      throw new HttpError(400, 'Las cajas de origen y destino deben ser distintas')
    }
    if (!(data.monto > 0)) {
      throw new HttpError(400, 'El monto debe ser mayor a 0')
    }

    await prisma.$transaction(async (tx) => {
      const [origen, destino] = await Promise.all([
        tx.caja.findUnique({ where: { id: data.cajaOrigenId } }),
        tx.caja.findUnique({ where: { id: data.cajaDestinoId } }),
      ])
      if (!origen) throw new HttpError(400, 'Caja origen no encontrada')
      if (!destino) throw new HttpError(400, 'Caja destino no encontrada')
      if (origen.estado !== 'ACTIVA' || destino.estado !== 'ACTIVA') {
        throw new HttpError(400, 'Ambas cajas deben estar activas')
      }
      if (origen.moneda !== destino.moneda) {
        throw new HttpError(400, 'Las cajas deben ser de la misma moneda')
      }

      const [conceptoSalida, conceptoEntrada] = await Promise.all([
        tx.conceptoCaja.findUnique({ where: { codigo: 'TRF-SALIDA-CAJAS' } }),
        tx.conceptoCaja.findUnique({ where: { codigo: 'TRF-ENTRADA-CAJAS' } }),
      ])
      if (!conceptoSalida || !conceptoEntrada) {
        throw new HttpError(400, 'Conceptos de transferencia no configurados. Reinicie el servidor para crearlos.')
      }

      // Decremento atómico del saldo de origen.
      const ok = await tx.caja.updateMany({
        where: { id: data.cajaOrigenId, saldoActual: { gte: data.monto } },
        data: { saldoActual: { decrement: data.monto } },
      })
      if (ok.count === 0) {
        throw new HttpError(400, 'Saldo insuficiente en la caja de origen')
      }

      await tx.caja.update({
        where: { id: data.cajaDestinoId },
        data: { saldoActual: { increment: data.monto } },
      })

      const fecha = new Date()
      const referencia = `TRF-${fecha.getTime()}`
      await tx.movimientoCaja.create({
        data: {
          codigo: generateCodigo('MOV-'),
          tipo: 'TRANSFERENCIA',
          monto: data.monto,
          descripcion: data.descripcion || `Transferencia a ${destino.nombre}`,
          metodoPago: 'EFECTIVO',
          referencia,
          fechaMovimiento: fecha,
          estado: 'REGISTRADO',
          cajaId: data.cajaOrigenId,
          conceptoId: conceptoSalida.id,
        },
      })
      await tx.movimientoCaja.create({
        data: {
          codigo: generateCodigo('MOV-'),
          tipo: 'TRANSFERENCIA',
          monto: data.monto,
          descripcion: data.descripcion || `Transferencia desde ${origen.nombre}`,
          metodoPago: 'EFECTIVO',
          referencia,
          fechaMovimiento: fecha,
          estado: 'REGISTRADO',
          cajaId: data.cajaDestinoId,
          conceptoId: conceptoEntrada.id,
        },
      })
    })

    return { success: true, message: 'Transferencia realizada correctamente' }
  },

  // Flujo Proyectado
  async listFlujoProyectado(params: { cajaId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }) {
    const { cajaId, estado, fechaInicio, fechaFin } = params

    const where: any = {}
    if (cajaId) where.cajaId = cajaId
    if (estado) where.estado = estado
    if (fechaInicio || fechaFin) {
      where.fecha = {}
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio)
      if (fechaFin) where.fecha.lte = new Date(fechaFin)
    }

    return prisma.flujoCajaProyectado.findMany({
      where, orderBy: { fecha: 'asc' },
      include: { caja: { select: { id: true, codigo: true, nombre: true } } },
    })
  },

  async createFlujoProyectado(data: any) {
    if (!data.cajaId) throw new HttpError(400, 'La caja es requerida')
    const caja = await prisma.caja.findUnique({ where: { id: Number(data.cajaId) } })
    if (!caja) throw new HttpError(400, 'Caja no encontrada')

    return prisma.flujoCajaProyectado.create({
      data: { ...data, fecha: new Date(data.fecha) },
      include: { caja: true },
    })
  },

  async updateFlujoProyectado(id: number, data: any) {
    const existing = await prisma.flujoCajaProyectado.findUnique({ where: { id } })
    if (!existing) return null

    if (data.cajaId !== undefined) {
      const caja = await prisma.caja.findUnique({ where: { id: Number(data.cajaId) } })
      if (!caja) throw new HttpError(400, 'Caja no encontrada')
    }

    const updateData: any = { ...data }
    if (data.fecha) updateData.fecha = new Date(data.fecha)
    return prisma.flujoCajaProyectado.update({ where: { id }, data: updateData, include: { caja: true } })
  },

  async deleteFlujoProyectado(id: number) {
    const existing = await prisma.flujoCajaProyectado.findUnique({ where: { id } })
    if (!existing) return false
    await prisma.flujoCajaProyectado.delete({ where: { id } })
    return true
  },

  // Resumen
  async getResumenCaja(cajaId: number) {
    const caja = await prisma.caja.findUnique({ where: { id: cajaId } })
    if (!caja) return null

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const [movimientosHoy, arqueosPendientes, flujoProximos] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where: { cajaId, estado: { not: 'ANULADO' }, fechaMovimiento: { gte: hoy, lt: manana } },
        include: { concepto: true },
        orderBy: { fechaMovimiento: 'desc' },
      }),
      prisma.arqueoCaja.findMany({ where: { cajaId, estado: 'PENDIENTE' }, take: 5 }),
      prisma.flujoCajaProyectado.findMany({
        where: { cajaId, fecha: { gte: hoy }, estado: 'PROYECTADO' },
        orderBy: { fecha: 'asc' }, take: 10,
      }),
    ])

    const ingresosHoy = movimientosHoy.filter(m => m.concepto?.afectaSaldo === 'AUMENTA').reduce((a, m) => a + Number(m.monto), 0)
    const egresosHoy = movimientosHoy.filter(m => m.concepto?.afectaSaldo === 'DISMINUYE').reduce((a, m) => a + Number(m.monto), 0)

    return {
      caja: { id: caja.id, codigo: caja.codigo, nombre: caja.nombre, saldoActual: Number(caja.saldoActual), estado: caja.estado },
      hoy: { movimientos: movimientosHoy.length, ingresos: ingresosHoy, egresos: egresosHoy, neto: ingresosHoy - egresosHoy },
      arqueosPendientes: arqueosPendientes.length,
      flujoProximos: flujoProximos.length,
    }
  },
}
