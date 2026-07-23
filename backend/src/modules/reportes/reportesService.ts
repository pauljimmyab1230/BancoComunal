import prisma from '../../config/prisma'

export const reportesService = {
  async estadoCuentasSocio(socioId: number, fondoId?: number) {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: { beneficiarios: true },
    })
    if (!socio) return null

    const fondosWhere: any = { socioId }
    if (fondoId) fondosWhere.fondoId = fondoId

    const [cuentasAhorro, aportes, prestamos] = await Promise.all([
      prisma.cuentaAhorro.findMany({
        where: fondosWhere,
        include: {
          fondo: { select: { id: true, nombre: true } },
          movimientos: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      }),
      prisma.aporte.findMany({
        where: fondosWhere,
        include: { fondo: { select: { id: true, nombre: true } } },
        orderBy: { fechaAporte: 'desc' },
      }),
      prisma.prestamo.findMany({
        where: fondosWhere,
        include: {
          fondo: { select: { id: true, nombre: true } },
          cuotas: { orderBy: { numero: 'asc' } },
        },
        orderBy: { fechaDesembolso: 'desc' },
      }),
    ])

    const totalAhorros = cuentasAhorro.reduce((a, c) => a + Number(c.saldo), 0)
    const totalAportes = aportes.reduce((a, ap) => a + Number(ap.monto), 0)
    const prestamosActivos = prestamos.filter(p => p.estado === 'ACTIVO')
    const totalPrestamos = prestamosActivos.reduce((a, p) => a + Number(p.monto), 0)
    const totalCuotasPendientes = prestamosActivos.reduce((a, p) => {
      return a + p.cuotas.filter(c => c.estado !== 'PAGADO').length
    }, 0)
    const totalDeuda = prestamosActivos.reduce((a, p) => {
      return a + p.cuotas.filter(c => c.estado !== 'PAGADO').reduce((b, c) => b + Number(c.saldoPendiente), 0)
    }, 0)

    return {
      socio: { id: socio.id, codigo: socio.codigo, dni: socio.dni, nombres: socio.nombres, apellidoPaterno: socio.apellidoPaterno, apellidoMaterno: socio.apellidoMaterno, telefono: socio.telefono, email: socio.email, fechaIngreso: socio.fechaIngreso, estado: socio.estado },
      beneficiarios: socio.beneficiarios,
      resumen: { totalAhorros, totalAportes, totalPrestamos, totalCuotasPendientes, totalDeuda, prestamosActivos: prestamosActivos.length },
      cuentasAhorro,
      aportes,
      prestamos,
    }
  },

  async carteraCreditos(params: { fondoId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }) {
    const { fondoId, estado, fechaInicio, fechaFin } = params

    const where: any = {}
    if (fondoId) where.fondoId = fondoId
    if (estado && estado !== 'TODOS') where.estado = estado
    if (fechaInicio || fechaFin) {
      where.fechaDesembolso = {}
      if (fechaInicio) where.fechaDesembolso.gte = new Date(fechaInicio)
      if (fechaFin) where.fechaDesembolso.lte = new Date(fechaFin)
    }

    const prestamos = await prisma.prestamo.findMany({
      where,
      include: {
        socio: { select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, telefono: true } },
        fondo: { select: { id: true, nombre: true } },
        cuotas: { orderBy: { numero: 'asc' } },
      },
      orderBy: { fechaDesembolso: 'desc' },
    })

    const hoy = new Date()

    const cartera = prestamos.map(p => {
      const cuotasPagadas = p.cuotas.filter(c => c.estado === 'PAGADO').length
      const cuotasVencidas = p.cuotas.filter(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL').length
      const cuotasPendientes = p.cuotas.filter(c => c.estado === 'PENDIENTE').length
      const totalPagado = p.cuotas.reduce((a, c) => a + Number(c.montoPagado), 0)
      const saldoPendiente = p.cuotas.filter(c => c.estado !== 'PAGADO').reduce((a, c) => a + Number(c.saldoPendiente), 0)

      let diasAtraso = 0
      const cuotaVencida = p.cuotas.find(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL')
      if (cuotaVencida) {
        diasAtraso = Math.floor((hoy.getTime() - new Date(cuotaVencida.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        id: p.id,
        socio: p.socio,
        fondo: p.fondo,
        monto: Number(p.monto),
        tasaInteres: Number(p.tasaInteres),
        numeroCuotas: p.numeroCuotas,
        montoCuota: Number(p.montoCuota),
        totalInteres: Number(p.totalInteres),
        fechaDesembolso: p.fechaDesembolso,
        estado: p.estado,
        cuotasPagadas,
        cuotasVencidas,
        cuotasPendientes,
        totalPagado,
        saldoPendiente,
        diasAtraso,
      }
    })

    const resumen = {
      totalPrestamos: cartera.length,
      prestamosActivos: cartera.filter(p => p.estado === 'ACTIVO').length,
      prestamosPagados: cartera.filter(p => p.estado === 'PAGADO').length,
      montoTotal: cartera.reduce((a, p) => a + p.monto, 0),
      saldoTotal: cartera.reduce((a, p) => a + p.saldoPendiente, 0),
      cuotasVencidas: cartera.reduce((a, p) => a + p.cuotasVencidas, 0),
      tasaMorosidad: cartera.length > 0 ? (cartera.filter(p => p.cuotasVencidas > 0).length / cartera.length * 100) : 0,
    }

    return { resumen, prestamos: cartera }
  },

  async estadoResultados(params: { fondoId?: number; fechaInicio: string; fechaFin: string }) {
    const { fondoId, fechaInicio, fechaFin } = params

    const whereFecha = { gte: new Date(fechaInicio), lte: new Date(fechaFin) }

    const fondosWhere: any = {}
    if (fondoId) fondosWhere.id = fondoId

    const fondos = await prisma.fondoRotatorio.findMany({
      where: fondosWhere,
      select: { id: true, nombre: true, capitalInicial: true, capitalDisponible: true, moneda: true },
    })

    const resultados = await Promise.all(fondos.map(async (fondo) => {
      const [cuotasPagadas, aportes, ahorrosRetiros] = await Promise.all([
        prisma.cuotaPrestamo.findMany({
          where: {
            prestamo: { fondoId: fondo.id },
            estado: 'PAGADO',
            fechaPago: whereFecha,
          },
          include: { prestamo: { select: { monto: true, tasaInteres: true } } },
        }),
        prisma.aporte.findMany({
          where: { fondoId: fondo.id, fechaAporte: whereFecha },
        }),
        prisma.ahorroMovimiento.findMany({
          where: {
            cuenta: { fondoId: fondo.id },
            tipo: 'RETIRO',
            createdAt: whereFecha,
          },
        }),
      ])

      const ingresosIntereses = cuotasPagadas.reduce((a, c) => a + Number(c.interes), 0)
      const ingresosAportes = aportes.reduce((a, ap) => a + Number(ap.monto), 0)
      const totalIngresos = ingresosIntereses + ingresosAportes

      const egresosRetiros = ahorrosRetiros.reduce((a, r) => a + Number(r.monto), 0)

      return {
        fondo: { id: fondo.id, nombre: fondo.nombre, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible), moneda: fondo.moneda },
        ingresos: { intereses: ingresosIntereses, aportes: ingresosAportes, total: totalIngresos },
        egresos: { retiros: egresosRetiros, total: egresosRetiros },
        resultadoNeto: totalIngresos - egresosRetiros,
        detalle: { cuotasPagadas: cuotasPagadas.length, aportes: aportes.length, retiros: ahorrosRetiros.length },
      }
    }))

    const totales = resultados.reduce((a, r) => ({
      ingresos: a.ingresos + r.ingresos.total,
      egresos: a.egresos + r.egresos.total,
      neto: a.neto + r.resultadoNeto,
    }), { ingresos: 0, egresos: 0, neto: 0 })

    return { fondos: resultados, totales, periodo: { inicio: fechaInicio, fin: fechaFin } }
  },

  async reporteAportes(params: { fondoId?: number; periodo?: string; tipo?: string }) {
    const { fondoId, periodo, tipo } = params

    const where: any = {}
    if (fondoId) where.fondoId = fondoId
    if (periodo) where.periodo = periodo
    if (tipo && tipo !== 'TODOS') where.tipo = tipo

    const aportes = await prisma.aporte.findMany({
      where,
      include: {
        socio: { select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true } },
        fondo: { select: { id: true, nombre: true } },
        fondoSocio: { select: { fechaIngreso: true } },
      },
      orderBy: { fechaAporte: 'desc' },
    })

    const resumen = {
      totalAportes: aportes.length,
      montoTotal: aportes.reduce((a, ap) => a + Number(ap.monto), 0),
      porTipo: {
        obligatorio: aportes.filter(ap => ap.tipo === 'OBLIGATORIO').reduce((a, ap) => a + Number(ap.monto), 0),
        extraordinario: aportes.filter(ap => ap.tipo === 'EXTRAORDINARIO').reduce((a, ap) => a + Number(ap.monto), 0),
        voluntario: aportes.filter(ap => ap.tipo === 'VOLUNTARIO').reduce((a, ap) => a + Number(ap.monto), 0),
      },
      porMetodo: aportes.reduce((acc, ap) => {
        acc[ap.metodoPago] = (acc[ap.metodoPago] || 0) + Number(ap.monto)
        return acc
      }, {} as Record<string, number>),
    }

    return { aportes, resumen }
  },

  async morosos(params: { fondoId?: number; diasMinimos?: number }) {
    const { fondoId, diasMinimos = 1 } = params
    const hoy = new Date()

    const wherePrestamo: any = { estado: 'ACTIVO' }
    if (fondoId) wherePrestamo.fondoId = fondoId

    const prestamos = await prisma.prestamo.findMany({
      where: wherePrestamo,
      include: {
        socio: { select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, telefono: true, email: true } },
        fondo: { select: { id: true, nombre: true } },
        cuotas: { where: { estado: { in: ['VENCIDO', 'PARCIAL', 'PENDIENTE'] } }, orderBy: { numero: 'asc' } },
      },
    })

    const morosos = prestamos
      .map(p => {
        const cuotasAtrasadas = p.cuotas.filter(c => {
          if (c.estado === 'PAGADO') return false
          const dias = Math.floor((hoy.getTime() - new Date(c.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
          return dias >= diasMinimos
        })

        if (cuotasAtrasadas.length === 0) return null

        const montoAdeudado = cuotasAtrasadas.reduce((a, c) => a + Number(c.saldoPendiente), 0)
        const diasMaxAtraso = Math.max(...cuotasAtrasadas.map(c =>
          Math.floor((hoy.getTime() - new Date(c.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
        ))

        return {
          socio: p.socio,
          prestamo: { id: p.id, monto: Number(p.monto), montoCuota: Number(p.montoCuota), numeroCuotas: p.numeroCuotas, fechaDesembolso: p.fechaDesembolso },
          fondo: p.fondo,
          cuotasAtrasadas: cuotasAtrasadas.length,
          montoAdeudado,
          diasMaxAtraso,
          cuotas: cuotasAtrasadas.map(c => ({
            numero: c.numero,
            fechaVencimiento: c.fechaVencimiento,
            monto: Number(c.monto),
            saldoPendiente: Number(c.saldoPendiente),
            estado: c.estado,
          })),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.diasMaxAtraso - a!.diasMaxAtraso)

    const resumen = {
      totalMorosos: morosos.length,
      montoTotalAdeudado: morosos.reduce((a, m) => a + m!.montoAdeudado, 0),
      cuotasVencidasTotal: morosos.reduce((a, m) => a + m!.cuotasAtrasadas, 0),
    }

    return { morosos, resumen }
  },

  async resumenEjecutivo() {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1)

    const [totalSocios, sociosActivos, totalFondos, fondosActivos, prestamos, cuotasHoy, aportesMes, ahorros, cajas] = await Promise.all([
      prisma.socio.count(),
      prisma.socio.count({ where: { estado: 'A' } }),
      prisma.fondoRotatorio.count(),
      prisma.fondoRotatorio.count({ where: { estado: 'ACTIVO' } }),
      prisma.prestamo.findMany({
        where: { estado: 'ACTIVO' },
        select: { monto: true, cuotas: { select: { monto: true, montoPagado: true, saldoPendiente: true, estado: true, fechaVencimiento: true } } },
      }),
      prisma.cuotaPrestamo.findMany({
        where: { fechaVencimiento: { gte: hoy, lt: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) } },
        include: { prestamo: { select: { socio: { select: { nombres: true, apellidoPaterno: true, telefono: true } } } } },
      }),
      prisma.aporte.findMany({
        where: { fechaAporte: { gte: inicioMes } },
        select: { monto: true, tipo: true },
      }),
      prisma.cuentaAhorro.findMany({
        select: { saldo: true },
      }),
      prisma.caja.findMany({
        where: { estado: 'ACTIVA' },
        select: { codigo: true, nombre: true, saldoActual: true },
      }),
    ])

    const capitalPrestado = prestamos.reduce((a, p) => a + Number(p.monto), 0)
    const capitalRecuperado = prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => b + Number(c.montoPagado), 0), 0)
    const saldoPendienteCartera = prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => b + Number(c.saldoPendiente), 0), 0)
    const cuotasVencidas = prestamos.reduce((a, p) => a + p.cuotas.filter(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL').length, 0)

    const totalAhorros = ahorros.reduce((a, c) => a + Number(c.saldo), 0)
    const totalAportesMes = aportesMes.reduce((a, ap) => a + Number(ap.monto), 0)
    const totalSaldoCajas = cajas.reduce((a, c) => a + Number(c.saldoActual), 0)

    return {
      socios: { total: totalSocios, activos: sociosActivos, inactivos: totalSocios - sociosActivos },
      fondos: { total: totalFondos, activos: fondosActivos },
      creditos: {
        activos: prestamos.length,
        capitalPrestado,
        capitalRecuperado,
        saldoPendiente: saldoPendienteCartera,
        cuotasVencidas,
        tasaMorosidad: prestamos.length > 0 ? (prestamos.filter(p => p.cuotas.some(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL')).length / prestamos.length * 100) : 0,
      },
      ahorros: { total: totalAhorros, cuentas: ahorros.length },
      aportes: { mesActual: totalAportesMes, cantidad: aportesMes.length },
      cajas: cajas.map(c => ({ ...c, saldoActual: Number(c.saldoActual) })),
      totalSaldoCajas,
      cuotasPorVencer: cuotasHoy.length,
      cuotasPorVencerDetalle: cuotasHoy.slice(0, 10).map(c => ({
        socio: `${c.prestamo?.socio?.nombres} ${c.prestamo?.socio?.apellidoPaterno}`,
        telefono: c.prestamo?.socio?.telefono,
        monto: Number(c.monto),
        fechaVencimiento: c.fechaVencimiento,
      })),
    }
  },
}
