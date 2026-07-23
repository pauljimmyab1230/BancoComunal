import prisma from '../../config/prisma'

export const tesoreriaService = {
  async getDashboard(params: { cajaId?: number; fechaInicio?: string; fechaFin?: string }) {
    const { cajaId, fechaInicio, fechaFin } = params
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const whereFecha = fechaInicio && fechaFin
      ? { gte: new Date(fechaInicio), lte: new Date(fechaFin) }
      : fechaInicio ? { gte: new Date(fechaInicio) }
        : fechaFin ? { lte: new Date(fechaFin) }
        : undefined

    const cajasWhere: any = { estado: 'ACTIVA' }
    if (cajaId) cajasWhere.id = cajaId

    const [cajas, movimientosHoy, arqueosPendientes, flujoProximos] = await Promise.all([
      prisma.caja.findMany({
        where: cajasWhere,
        select: { id: true, codigo: true, nombre: true, saldoActual: true, tipo: true, moneda: true },
      }),
      prisma.movimientoCaja.findMany({
        where: {
          cajaId: cajaId,
          estado: { not: 'ANULADO' },
          fechaMovimiento: { gte: hoy, lt: manana },
        },
        include: { concepto: true, caja: { select: { codigo: true, nombre: true } } },
        orderBy: { fechaMovimiento: 'desc' },
      }),
      prisma.arqueoCaja.findMany({
        where: { estado: 'PENDIENTE', cajaId: cajaId || undefined },
        take: 10,
        orderBy: { fechaArqueo: 'desc' },
        include: { caja: { select: { codigo: true, nombre: true } }, responsable: { select: { nombres: true, apellidoPaterno: true } } },
      }),
      prisma.flujoCajaProyectado.findMany({
        where: {
          cajaId: cajaId || undefined,
          fecha: { gte: hoy },
          estado: 'PROYECTADO',
        },
        orderBy: { fecha: 'asc' },
        take: 20,
        include: { caja: { select: { codigo: true, nombre: true } } },
      }),
    ])

    // Resumen global
    const cajasConResumen = await Promise.all(cajas.map(async (caja) => {
      const movs = await prisma.movimientoCaja.findMany({
        where: {
          cajaId: caja.id,
          estado: { not: 'ANULADO' },
          fechaMovimiento: whereFecha,
        },
        include: { concepto: true },
      })

      const ingresos = movs.filter(m => m.concepto?.afectaSaldo === 'AUMENTA').reduce((a, m) => a + Number(m.monto), 0)
      const egresos = movs.filter(m => m.concepto?.afectaSaldo === 'DISMINUYE').reduce((a, m) => a + Number(m.monto), 0)

      return {
        ...caja,
        saldoActual: Number(caja.saldoActual),
        periodo: { ingresos, egresos, neto: ingresos - egresos, movimientos: movs.length },
      }
    }))

    const totalSaldo = cajasConResumen.reduce((a, c) => a + c.saldoActual, 0)
    const totalIngresosHoy = movimientosHoy.filter(m => m.concepto?.afectaSaldo === 'AUMENTA').reduce((a, m) => a + Number(m.monto), 0)
    const totalEgresosHoy = movimientosHoy.filter(m => m.concepto?.afectaSaldo === 'DISMINUYE').reduce((a, m) => a + Number(m.monto), 0)

    return {
      resumen: {
        totalCajas: cajas.length,
        totalSaldo,
        arqueosPendientes: arqueosPendientes.length,
        flujoProximos: flujoProximos.length,
        hoy: { ingresos: totalIngresosHoy, egresos: totalEgresosHoy, neto: totalIngresosHoy - totalEgresosHoy, movimientos: movimientosHoy.length },
      },
      cajas: cajasConResumen,
      movimientosHoy,
      arqueosPendientes,
      flujoProximos,
    }
  },

  async getResumenCaja(cajaId: number, fechaInicio?: string, fechaFin?: string) {
    const caja = await prisma.caja.findUnique({ where: { id: cajaId } })
    if (!caja) return null

    const whereFecha = fechaInicio && fechaFin
      ? { gte: new Date(fechaInicio), lte: new Date(fechaFin) }
      : fechaInicio ? { gte: new Date(fechaInicio) }
        : fechaFin ? { lte: new Date(fechaFin) }
        : undefined

    const [movimientos, arqueos, flujoProyectado] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where: { cajaId, estado: { not: 'ANULADO' }, fechaMovimiento: whereFecha },
        include: { concepto: true, registrador: { select: { nombres: true, apellidoPaterno: true } } },
        orderBy: { fechaMovimiento: 'desc' },
      }),
      prisma.arqueoCaja.findMany({
        where: { cajaId, fechaArqueo: whereFecha },
        orderBy: { fechaArqueo: 'desc' },
        include: { responsable: { select: { nombres: true, apellidoPaterno: true } }, aprobador: { select: { nombres: true, apellidoPaterno: true } } },
      }),
      prisma.flujoCajaProyectado.findMany({
        where: { cajaId, fecha: { gte: new Date() }, estado: 'PROYECTADO' },
        orderBy: { fecha: 'asc' },
      }),
    ])

    const ingresos = movimientos.filter(m => m.concepto?.afectaSaldo === 'AUMENTA').reduce((a, m) => a + Number(m.monto), 0)
    const egresos = movimientos.filter(m => m.concepto?.afectaSaldo === 'DISMINUYE').reduce((a, m) => a + Number(m.monto), 0)

    // Agrupar por concepto
    const porConcepto = movimientos.reduce((acc, m) => {
      const key = m.concepto?.nombre || 'Sin concepto'
      const tipo = m.concepto?.afectaSaldo || 'NO_AFECTA'
      if (!acc[key]) acc[key] = { concepto: key, tipo, cantidad: 0, total: 0 }
      acc[key].cantidad++
      acc[key].total += Number(m.monto)
      return acc
    }, {} as Record<string, { concepto: string; tipo: string; cantidad: number; total: number }>)

    // Agrupar por día
    const porDia = movimientos.reduce((acc, m) => {
      const fecha = m.fechaMovimiento.toISOString().split('T')[0]
      if (!acc[fecha]) acc[fecha] = { fecha, ingresos: 0, egresos: 0, neto: 0, movimientos: 0 }
      acc[fecha].movimientos++
      if (m.concepto?.afectaSaldo === 'AUMENTA') acc[fecha].ingresos += Number(m.monto)
      else if (m.concepto?.afectaSaldo === 'DISMINUYE') acc[fecha].egresos += Number(m.monto)
      return acc
    }, {} as Record<string, { fecha: string; ingresos: number; egresos: number; neto: number; movimientos: number }>)

    Object.values(porDia).forEach(d => d.neto = d.ingresos - d.egresos)

    return {
      caja: { id: caja.id, codigo: caja.codigo, nombre: caja.nombre, saldoActual: Number(caja.saldoActual), saldoInicial: Number(caja.saldoInicial) },
      periodo: { ingresos, egresos, neto: ingresos - egresos, movimientos: movimientos.length },
      porConcepto: Object.values(porConcepto).sort((a, b) => b.total - a.total),
      porDia: Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      arqueos,
      flujoProyectado,
    }
  },

  async getFlujoCaja(params: { cajaId?: number; fechaInicio: string; fechaFin: string; agruparPor: string; tipo: string }) {
    const { cajaId, fechaInicio, fechaFin, agruparPor, tipo } = params

    const where: any = {
      estado: { not: 'ANULADO' },
      fechaMovimiento: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
    }
    if (cajaId) where.cajaId = cajaId

    const movimientos = await prisma.movimientoCaja.findMany({
      where,
      include: { concepto: true, caja: { select: { codigo: true, nombre: true } } },
      orderBy: { fechaMovimiento: 'asc' },
    })

    let filtered = movimientos
    if (tipo === 'INGRESO') filtered = movimientos.filter(m => m.concepto?.afectaSaldo === 'AUMENTA')
    else if (tipo === 'EGRESO') filtered = movimientos.filter(m => m.concepto?.afectaSaldo === 'DISMINUYE')

    const groupFn = (m: any) => {
      const date = new Date(m.fechaMovimiento)
      if (agruparPor === 'DIA') return date.toISOString().split('T')[0]
      if (agruparPor === 'SEMANA') {
        const week = Math.ceil(date.getDate() / 7)
        return `${date.getFullYear()}-W${String(date.getMonth() + 1).padStart(2, '0')}-${week}`
      }
      if (agruparPor === 'MES') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return m.concepto?.nombre || 'Sin concepto'
    }

    const grupos = filtered.reduce((acc, m) => {
      const key = groupFn(m)
      if (!acc[key]) {
        acc[key] = { grupo: key, ingresos: 0, egresos: 0, neto: 0, movimientos: 0, detalle: [] }
      }
      acc[key].movimientos++
      if (m.concepto?.afectaSaldo === 'AUMENTA') acc[key].ingresos += Number(m.monto)
      else if (m.concepto?.afectaSaldo === 'DISMINUYE') acc[key].egresos += Number(m.monto)
      acc[key].detalle.push(m)
      return acc
    }, {} as Record<string, any>)

    Object.values(grupos).forEach((g: any) => g.neto = g.ingresos - g.egresos)

    return Object.values(grupos).sort((a: any, b: any) => a.grupo.localeCompare(b.grupo))
  },

  async conciliacionBancaria(params: { cajaId: number; fechaInicio: string; fechaFin: string; saldoBanco: number; movimientosBanco?: any[] }) {
    const { cajaId, fechaInicio, fechaFin, saldoBanco, movimientosBanco = [] } = params

    const movimientosSistema = await prisma.movimientoCaja.findMany({
      where: {
        cajaId,
        estado: { not: 'ANULADO' },
        fechaMovimiento: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
      },
      include: { concepto: true },
      orderBy: { fechaMovimiento: 'asc' },
    })

    const saldoSistema = movimientosSistema.reduce((acc, m) => {
      if (m.concepto?.afectaSaldo === 'AUMENTA') return acc + Number(m.monto)
      if (m.concepto?.afectaSaldo === 'DISMINUYE') return acc - Number(m.monto)
      return acc
    }, 0)

    // Conciliación simple: comparar movimientos
    const conciliados: any[] = []
    const pendientesSistema: any[] = [...movimientosSistema]
    const pendientesBanco: any[] = [...movimientosBanco]

    // Marcar conciliados por monto y fecha aproximada
    for (const movBanco of movimientosBanco) {
      const idx = pendientesSistema.findIndex(m => 
        Math.abs(Number(m.monto) - movBanco.monto) < 0.01 &&
        Math.abs(new Date(m.fechaMovimiento).getTime() - new Date(movBanco.fecha).getTime()) < 2 * 24 * 60 * 60 * 1000
      )
      if (idx >= 0) {
        conciliados.push({ sistema: pendientesSistema[idx], banco: movBanco })
        pendientesSistema.splice(idx, 1)
      }
    }

    return {
      cajaId,
      periodo: { inicio: fechaInicio, fin: fechaFin },
      saldoBanco,
      saldoSistema,
      diferencia: saldoBanco - saldoSistema,
      conciliados: conciliados.length,
      pendientesSistema: pendientesSistema.length,
      pendientesBanco: pendientesBanco.length,
      detalle: {
        conciliados,
        pendientesSistema,
        pendientesBanco,
      },
    }
  },

  async transferenciaEntreCajas(data: { cajaOrigenId: number; cajaDestinoId: number; monto: number; concepto: string; descripcion?: string; comprobante?: string }, registradorId: number) {
    const [cajaOrigen, cajaDestino] = await Promise.all([
      prisma.caja.findUnique({ where: { id: data.cajaOrigenId } }),
      prisma.caja.findUnique({ where: { id: data.cajaDestinoId } }),
    ])

    if (!cajaOrigen || !cajaDestino) throw new Error('Caja origen o destino no encontrada')
    if (cajaOrigen.estado !== 'ACTIVA' || cajaDestino.estado !== 'ACTIVA') throw new Error('Ambas cajas deben estar activas')
    if (Number(cajaOrigen.saldoActual) < data.monto) throw new Error('Saldo insuficiente en caja origen')

    const conceptoTransferencia = await prisma.conceptoCaja.findFirst({ where: { codigo: 'TRF-ENTRE-CAJAS', tipo: 'TRANSFERENCIA' } })

    if (!conceptoTransferencia) throw new Error('Concepto de transferencia no configurado (TRF-ENTRE-CAJAS)')

    const codigo = `TRF-${Date.now()}`

    return prisma.$transaction(async (tx) => {
      // Egreso en origen
      await tx.movimientoCaja.create({
        data: {
          codigo: `${codigo}-OUT`,
          tipo: 'EGRESO',
          monto: data.monto,
          descripcion: `Transferencia a ${cajaDestino.nombre}: ${data.concepto}`,
          comprobante: data.comprobante,
          metodoPago: 'TRANSFERENCIA',
          fechaMovimiento: new Date(),
          estado: 'REGISTRADO',
          cajaId: data.cajaOrigenId,
          conceptoId: conceptoTransferencia.id,
          registradorId,
        },
      })

      await tx.caja.update({
        where: { id: data.cajaOrigenId },
        data: { saldoActual: Number(cajaOrigen.saldoActual) - data.monto },
      })

      // Ingreso en destino
      await tx.movimientoCaja.create({
        data: {
          codigo: `${codigo}-IN`,
          tipo: 'INGRESO',
          monto: data.monto,
          descripcion: `Transferencia desde ${cajaOrigen.nombre}: ${data.concepto}`,
          comprobante: data.comprobante,
          metodoPago: 'TRANSFERENCIA',
          fechaMovimiento: new Date(),
          estado: 'REGISTRADO',
          cajaId: data.cajaDestinoId,
          conceptoId: conceptoTransferencia.id,
          registradorId,
        },
      })

      await tx.caja.update({
        where: { id: data.cajaDestinoId },
        data: { saldoActual: Number(cajaDestino.saldoActual) + data.monto },
      })

      return { success: true, codigo, monto: data.monto }
    })
  },

  async getProyeccionFlujo(params: { cajaId: number; meses: number }) {
    const { cajaId, meses } = params
    const hoy = new Date()
    const fechaFin = new Date(hoy)
    fechaFin.setMonth(fechaFin.getMonth() + meses)

    const [flujoProyectado, historico] = await Promise.all([
      prisma.flujoCajaProyectado.findMany({
        where: { cajaId, fecha: { gte: hoy, lte: fechaFin }, estado: 'PROYECTADO' },
        orderBy: { fecha: 'asc' },
      }),
      prisma.movimientoCaja.findMany({
        where: {
          cajaId,
          estado: { not: 'ANULADO' },
          fechaMovimiento: { gte: new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1), lte: hoy },
        },
        include: { concepto: true },
      }),
    ])

    // Calcular promedios históricos por concepto
    const promediosMap = historico.reduce((acc, m) => {
      const key = m.concepto?.nombre || 'Otros'
      if (!acc[key]) acc[key] = { ingresos: 0, egresos: 0, count: 0 }
      if (m.concepto?.afectaSaldo === 'AUMENTA') acc[key].ingresos += Number(m.monto)
      else if (m.concepto?.afectaSaldo === 'DISMINUYE') acc[key].egresos += Number(m.monto)
      acc[key].count++
      return acc
    }, {} as Record<string, { ingresos: number; egresos: number; count: number }>)

    const promedios = Object.entries(promediosMap).map(([concepto, p]) => ({
      concepto,
      ingresos: p.ingresos,
      egresos: p.egresos,
      count: p.count,
      ingresoPromedio: p.count > 0 ? p.ingresos / p.count : 0,
      egresoPromedio: p.count > 0 ? p.egresos / p.count : 0,
    }))

    return {
      cajaId,
      periodo: { inicio: hoy.toISOString().split('T')[0], fin: fechaFin.toISOString().split('T')[0] },
      flujoProyectado,
      promediosHistoricos: promedios,
    }
  },
}