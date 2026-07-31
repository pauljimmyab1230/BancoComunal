import prisma from '../../config/prisma'

function generateCodigo(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const cajaService = {
  // Cajas
  async list(params: { search?: string; page?: number; limit?: number; estado?: string; tipo?: string; fondoId?: number }) {
    const { search, page = 1, limit = 10, estado, tipo, fondoId } = params
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
        _count: undefined,
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
    if (!data.fondoId) throw new Error('La caja debe pertenecer a un fondo rotatorio')

    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: data.fondoId } })
    if (!fondo) throw new Error('Fondo no encontrado')
    if (fondo.estado !== 'ACTIVO') throw new Error('El fondo no está activo')

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
        estado: data.estado,
      },
      include: { fondo: { select: { id: true, nombre: true } } },
    })

    await this.crearConceptosPorDefecto()
    return caja
  },

  async crearConceptosPorDefecto() {
    const conceptos = [
      { codigo: 'ING-APORTE', nombre: 'Aporte de Socio', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 1 },
      { codigo: 'ING-AHORRO', nombre: 'Apertura Ahorro', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 2 },
      { codigo: 'ING-PRESTAMO', nombre: 'Desembolso Préstamo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 3 },
      { codigo: 'ING-CUOTA', nombre: 'Pago Cuota Préstamo', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 4 },
      { codigo: 'ING-INTERES', nombre: 'Interés Cobrado', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 5 },
      { codigo: 'ING-OTRO', nombre: 'Otros Ingresos', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', orden: 6 },
      { codigo: 'EGR-RETIRO', nombre: 'Retiro Ahorro', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 10 },
      { codigo: 'EGR-GASTO', nombre: 'Gasto Operativo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 11 },
      { codigo: 'EGR-PROVISION', nombre: 'Provisión Fondo', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 12 },
      { codigo: 'EGR-OTRO', nombre: 'Otros Egresos', tipo: 'EGRESO', afectaSaldo: 'DISMINUYE', orden: 13 },
      { codigo: 'TRF-ENTRE-CAJAS', nombre: 'Transferencia Entre Cajas', tipo: 'TRANSFERENCIA', afectaSaldo: 'NO_AFECTA', orden: 20 },
    ]

    for (const c of conceptos) {
      await prisma.conceptoCaja.upsert({
        where: { codigo: c.codigo },
        update: {},
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
      if (!fondo) throw new Error('Fondo no encontrado')
      updateData.fondoId = Number(data.fondoId)
    }
    if (data.estado !== undefined) updateData.estado = data.estado

    return prisma.caja.update({ where: { id }, data: updateData, include: { fondo: { select: { id: true, nombre: true } } } })
  },

  async delete(id: number) {
    const caja = await prisma.caja.findUnique({ where: { id } })
    if (!caja) return false

    const [movimientosCount, arqueosCount] = await Promise.all([
      prisma.movimientoCaja.count({ where: { cajaId: id } }),
      prisma.arqueoCaja.count({ where: { cajaId: id } }),
    ])

    if (movimientosCount > 0 || arqueosCount > 0) {
      return 'No se puede eliminar: la caja tiene movimientos o arqueos registrados. Inactive la caja en su lugar.'
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
    return prisma.conceptoCaja.update({ where: { id }, data })
  },

  async deleteConcepto(id: number) {
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
    if (!caja) throw new Error('Caja no encontrada')
    if (caja.estado !== 'ACTIVA') throw new Error('La caja no está activa')

    const concepto = await prisma.conceptoCaja.findUnique({ where: { id: data.conceptoId } })
    if (!concepto) throw new Error('Concepto no encontrado')

    const codigo = generateCodigo('MOV-')
    let exists = await prisma.movimientoCaja.findUnique({ where: { codigo } })
    while (exists) {
      exists = await prisma.movimientoCaja.findUnique({ where: { codigo: generateCodigo('MOV-') } })
    }

    const fechaMovimiento = data.fechaMovimiento ? new Date(data.fechaMovimiento) : new Date()
    const saldoAnterior = Number(caja.saldoActual)

    let saldoNuevo = saldoAnterior
    if (concepto.afectaSaldo === 'AUMENTA') saldoNuevo += Number(data.monto)
    else if (concepto.afectaSaldo === 'DISMINUYE') saldoNuevo -= Number(data.monto)

    const movimiento = await prisma.$transaction(async (tx) => {
      const mov = await tx.movimientoCaja.create({
        data: {
          codigo, tipo: data.tipo, monto: data.monto, descripcion: data.descripcion,
          comprobante: data.comprobante, metodoPago: data.metodoPago, referencia: data.referencia,
          fechaMovimiento, estado: 'REGISTRADO', cajaId: data.cajaId,
          conceptoId: data.conceptoId,
        },
        include: { caja: true, concepto: true },
      })
      await tx.caja.update({ where: { id: data.cajaId }, data: { saldoActual: saldoNuevo } })
      return mov
    })

    return movimiento
  },

  async anularMovimiento(id: number) {
    const movimiento = await prisma.movimientoCaja.findUnique({
      where: { id }, include: { caja: true, concepto: true },
    })
    if (!movimiento) throw new Error('Movimiento no encontrado')
    if (movimiento.estado === 'ANULADO') throw new Error('Movimiento ya anulado')

    const caja = movimiento.caja
    const concepto = movimiento.concepto
    const saldoAnterior = Number(caja.saldoActual)

    let saldoNuevo = saldoAnterior
    if (concepto?.afectaSaldo === 'AUMENTA') saldoNuevo -= Number(movimiento.monto)
    else if (concepto?.afectaSaldo === 'DISMINUYE') saldoNuevo += Number(movimiento.monto)

    await prisma.$transaction(async (tx) => {
      await tx.movimientoCaja.update({ where: { id }, data: { estado: 'ANULADO' } })
      await tx.caja.update({ where: { id: caja.id }, data: { saldoActual: saldoNuevo } })
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
    if (!caja) throw new Error('Caja no encontrada')

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

  async aprobarArqueo(id: number, data: any) {
    const arqueo = await prisma.arqueoCaja.findUnique({ where: { id } })
    if (!arqueo) throw new Error('Arqueo no encontrado')
    if (arqueo.estado === 'APROBADO' || arqueo.estado === 'RECHAZADO') throw new Error('Arqueo ya procesado')

    return prisma.arqueoCaja.update({
      where: { id },
      data: {
        estado: data.estado,
        fechaAprobacion: new Date(),
        observacion: data.observacion || arqueo.observacion,
      },
      include: { caja: true },
    })
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
    return prisma.flujoCajaProyectado.create({
      data: { ...data, fecha: new Date(data.fecha) },
      include: { caja: true },
    })
  },

  async updateFlujoProyectado(id: number, data: any) {
    const updateData: any = { ...data }
    if (data.fecha) updateData.fecha = new Date(data.fecha)
    return prisma.flujoCajaProyectado.update({ where: { id }, data: updateData, include: { caja: true } })
  },

  async deleteFlujoProyectado(id: number) {
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
