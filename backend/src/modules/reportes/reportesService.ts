import prisma from '../../config/prisma'

const socioSelect = {
  id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, telefono: true,
} as const

export const reportesService = {
  async estadoCuentasSocio(params: { socioId?: number; search?: string; fondoId?: number }) {

    let socioId = params.socioId
    if (socioId === undefined && params.search) {
      const found = await prisma.socio.findFirst({
        where: { OR: [{ codigo: params.search }, { dni: params.search }] },
        select: { id: true },
      })
      if (!found) return null
      socioId = found.id
    }
    if (socioId === undefined) return null

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: { beneficiarios: true },
    })
    if (!socio) return null

    const fondosWhere: any = { fondoSocio: { socioId } }
    if (params.fondoId) fondosWhere.fondoSocio.fondoId = params.fondoId

    const [aportes, prestamos] = await Promise.all([
      prisma.aporte.findMany({
        where: { ...fondosWhere, estado: 'ACTIVO' },
        include: {
          fondoSocio: { select: { id: true, fechaIngreso: true, fondo: { select: { id: true, nombre: true } } } },
        },
        orderBy: { fechaAporte: 'desc' },
      }),
      prisma.prestamo.findMany({
        where: fondosWhere,
        include: {
          fondoSocio: { select: { id: true, fechaIngreso: true, fondo: { select: { id: true, nombre: true } } } },
          cuotas: { orderBy: { numero: 'asc' } },
        },
        orderBy: { fechaDesembolso: 'desc' },
      }),
    ])

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
      resumen: { totalAportes, totalPrestamos, totalCuotasPendientes, totalDeuda, prestamosActivos: prestamosActivos.length },
      aportes: aportes.map((a) => ({ ...a, monto: Number(a.monto), fondo: a.fondoSocio?.fondo ?? null, fondoSocio: undefined })),
      prestamos: prestamos.map((p) => ({
        ...p,
        monto: Number(p.monto),
        tasaInteres: Number(p.tasaInteres),
        montoCuota: Number(p.montoCuota),
        totalInteres: Number(p.totalInteres),
        fondo: p.fondoSocio?.fondo ?? null,
        fondoSocio: undefined,
        cuotas: p.cuotas.map((c) => ({
          ...c,
          monto: Number(c.monto),
          interes: Number(c.interes),
          amortizacion: Number(c.amortizacion),
          saldo: Number(c.saldo),
          montoPagado: Number(c.montoPagado),
          saldoPendiente: Number(c.saldoPendiente),
        })),
      })),
    }
  },

  async carteraCreditos(params: { fondoId?: number; estado?: string; fechaInicio?: string; fechaFin?: string; limit?: number }) {

    const { fondoId, estado = 'TODOS', fechaInicio, fechaFin, limit = 1000 } = params

    const where: any = {}
    if (fondoId) where.fondoSocio = { fondoId: Number(fondoId) }
    // 'TODOS' muestra la cartera real (activos + pagados); los anulados no son cartera
    // y sus saldos pendientes no deben sumarse a los totales.
    if (estado === 'TODOS') where.estado = { not: 'ANULADO' }
    else where.estado = estado
    if (fechaInicio || fechaFin) {
      where.fechaDesembolso = {}
      if (fechaInicio) where.fechaDesembolso.gte = new Date(fechaInicio)
      if (fechaFin) where.fechaDesembolso.lte = new Date(fechaFin)
    }

    const prestamos = await prisma.prestamo.findMany({
      where,
      include: {
        fondoSocio: {
          select: {
            socio: { select: socioSelect },
            fondo: { select: { id: true, nombre: true, moneda: true } },
          },
        },
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
        socio: p.fondoSocio?.socio ?? null,
        fondo: p.fondoSocio?.fondo ?? null,
        moneda: p.fondoSocio?.fondo?.moneda ?? null,
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

    const carteraValida = cartera.filter(p => p.estado !== 'ANULADO')

    const resumen = {
      totalPrestamos: carteraValida.length,
      prestamosActivos: carteraValida.filter(p => p.estado === 'ACTIVO').length,
      prestamosPagados: carteraValida.filter(p => p.estado === 'PAGADO').length,
      montoTotal: carteraValida.reduce((a, p) => a + p.monto, 0),
      saldoTotal: carteraValida.reduce((a, p) => a + p.saldoPendiente, 0),
      cuotasVencidas: carteraValida.reduce((a, p) => a + p.cuotasVencidas, 0),
      tasaMorosidad: carteraValida.length > 0 ? (carteraValida.filter(p => p.cuotasVencidas > 0).length / carteraValida.length * 100) : 0,
    }

    return { resumen, prestamos: cartera.slice(0, limit) }
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
      const cajas = await prisma.caja.findMany({ where: { fondoId: fondo.id }, select: { id: true } })
      const cajaIds = cajas.map(c => c.id)

      const movimientos = cajaIds.length > 0
        ? await prisma.movimientoCaja.findMany({
            where: {
              cajaId: { in: cajaIds },
              estado: { not: 'ANULADO' },
              fechaMovimiento: whereFecha,
            },
            select: { monto: true, concepto: { select: { codigo: true } } },
          })
        : []

      const sum = (codigo: string) => movimientos
        .filter(m => m.concepto?.codigo === codigo)
        .reduce((a, m) => a + Number(m.monto), 0)

      const ingresos = {
        cuotas: sum('ING-CUOTA'),
        intereses: sum('ING-INTERES'),
        reintegros: sum('ING-REINTEGRO'),
        otros: sum('ING-OTRO') + sum('AJU-DIF-SOBRANTE'),
        total: 0,
      }
      ingresos.total = ingresos.cuotas + ingresos.intereses + ingresos.reintegros + ingresos.otros

      const egresos = {
        desembolsos: sum('ING-PRESTAMO'),
        gastos: sum('EGR-GASTO') + sum('EGR-OTRO') + sum('EGR-PROVISION'),
        faltantes: sum('AJU-DIF-FALTANTE'),
        total: 0,
      }
      egresos.total = egresos.desembolsos + egresos.gastos + egresos.faltantes

      const resultadoNeto = ingresos.total - egresos.total

      return {
        fondo: { id: fondo.id, nombre: fondo.nombre, capitalInicial: Number(fondo.capitalInicial), capitalDisponible: Number(fondo.capitalDisponible), moneda: fondo.moneda },
        ingresos,
        egresos,
        resultadoNeto,
      }
    }))

    const totales = resultados.reduce((a, r) => ({
      ingresos: a.ingresos + r.ingresos.total,
      egresos: a.egresos + r.egresos.total,
      neto: a.neto + r.resultadoNeto,
    }), { ingresos: 0, egresos: 0, neto: 0 })

    const totalesPorMoneda = resultados.reduce((acc, r) => {
      const moneda = r.fondo.moneda || 'PEN'
      acc[moneda] = (acc[moneda] || 0) + r.resultadoNeto
      return acc
    }, {} as Record<string, number>)

    return { fondos: resultados, totales, totalesPorMoneda, periodo: { inicio: fechaInicio, fin: fechaFin } }
  },

  async reporteAportes(params: { fondoId?: number; periodo?: string; tipo?: string; limit?: number }) {
    const { fondoId, periodo, tipo, limit = 1000 } = params

    const where: any = { estado: 'ACTIVO' }
    if (fondoId) where.fondoSocio = { fondoId: Number(fondoId) }
    if (periodo) where.periodo = periodo
    if (tipo && tipo !== 'TODOS') where.tipo = tipo

    const aportes = await prisma.aporte.findMany({
      where,
      include: {
        fondoSocio: {
          select: {
            fechaIngreso: true,
            socio: { select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true } },
            fondo: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { fechaAporte: 'desc' },
    })

    const resumen = {      totalAportes: aportes.length,
      montoTotal: aportes.reduce((a, ap) => a + Number(ap.monto), 0),
      porTipo: {
        obligatorio: aportes.filter(ap => ap.tipo === 'OBLIGATORIO').reduce((a, ap) => a + Number(ap.monto), 0),
        extraordinario: aportes.filter(ap => ap.tipo === 'EXTRAORDINARIO').reduce((a, ap) => a + Number(ap.monto), 0),
        voluntario: aportes.filter(ap => ap.tipo === 'VOLUNTARIO').reduce((a, ap) => a + Number(ap.monto), 0),
        multa: aportes.filter(ap => ap.tipo === 'MULTA').reduce((a, ap) => a + Number(ap.monto), 0),
      },
      porMetodo: aportes.reduce((acc, ap) => {
        acc[ap.metodoPago] = (acc[ap.metodoPago] || 0) + Number(ap.monto)
        return acc
      }, {} as Record<string, number>),
    }

    return {
      aportes: aportes.slice(0, limit).map((a) => ({
        ...a,
        monto: Number(a.monto),
        socio: a.fondoSocio?.socio ?? null,
        fondo: a.fondoSocio?.fondo ?? null,
        fondoSocio: undefined,
      })),
      resumen,
    }
  },

  async morosos(params: { fondoId?: number; diasMinimos?: number }) {

    const { fondoId, diasMinimos = 1 } = params
    const hoy = new Date()

    const wherePrestamo: any = { estado: 'ACTIVO' }
    if (fondoId) wherePrestamo.fondoSocio = { fondoId: Number(fondoId) }

    const prestamos = await prisma.prestamo.findMany({
      where: wherePrestamo,
      include: {
        fondoSocio: {
          select: {
            socio: { select: { id: true, codigo: true, dni: true, nombres: true, apellidoPaterno: true, telefono: true, email: true } },
            fondo: { select: { id: true, nombre: true } },
          },
        },
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
          socio: p.fondoSocio?.socio ?? null,
          prestamo: { id: p.id, monto: Number(p.monto), montoCuota: Number(p.montoCuota), numeroCuotas: p.numeroCuotas, fechaDesembolso: p.fechaDesembolso },
          fondo: p.fondoSocio?.fondo ?? null,
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

    const [totalSocios, sociosActivos, totalFondos, fondosActivos, prestamos, cuotasHoy, aportesMes, cajas] = await Promise.all([
      prisma.socio.count(),
      prisma.socio.count({ where: { estado: 'A' } }),
      prisma.fondoRotatorio.count(),
      prisma.fondoRotatorio.count({ where: { estado: 'ACTIVO' } }),
      prisma.prestamo.findMany({
        where: { estado: 'ACTIVO' },
        select: { monto: true, cuotas: { select: { monto: true, amortizacion: true, montoPagado: true, saldoPendiente: true, estado: true, fechaVencimiento: true } } },
      }),
      prisma.cuotaPrestamo.findMany({
        where: {
          fechaVencimiento: { gte: hoy, lt: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) },
          estado: { in: ['PENDIENTE', 'PARCIAL'] },
        },
        include: { prestamo: { select: { fondoSocio: { select: { socio: { select: { nombres: true, apellidoPaterno: true, telefono: true } } } } } } },
      }),
      prisma.aporte.findMany({
        where: { fechaAporte: { gte: inicioMes } },
        select: { monto: true, tipo: true },
      }),
      prisma.caja.findMany({
        where: { estado: 'ACTIVA' },
        select: { codigo: true, nombre: true, saldoActual: true, moneda: true },
      }),
    ])

    const capitalPrestado = prestamos.reduce((a, p) => a + Number(p.monto), 0)
    // Solo la parte de amortización (capital) recuperada; el interés no es capital.
    const capitalRecuperado = Math.round(prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => {
      const cMonto = Number(c.monto)
      const cPagado = Number(c.montoPagado)
      if (cPagado <= 0) return b
      const proporcion = cMonto > 0 ? Math.min(1, cPagado / cMonto) : 1
      return b + Number(c.amortizacion) * proporcion
    }, 0), 0) * 100) / 100
    const saldoPendienteCartera = prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => b + Number(c.saldoPendiente), 0), 0)
    const cuotasVencidas = prestamos.reduce((a, p) => a + p.cuotas.filter(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL').length, 0)

    const totalAportesMes = aportesMes.reduce((a, ap) => a + Number(ap.monto), 0)
    const totalSaldoCajas = cajas.reduce((a, c) => a + Number(c.saldoActual), 0)
    const totalSaldoCajasPorMoneda = cajas.reduce((acc, c) => {
      const moneda = c.moneda || 'PEN'
      acc[moneda] = (acc[moneda] || 0) + Number(c.saldoActual)
      return acc
    }, {} as Record<string, number>)

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
      aportes: { mesActual: totalAportesMes, cantidad: aportesMes.length },
      cajas: cajas.map(c => ({ ...c, saldoActual: Number(c.saldoActual) })),
      totalSaldoCajas,
      totalSaldoCajasPorMoneda,
      cuotasPorVencer: cuotasHoy.length,
      cuotasPorVencerDetalle: cuotasHoy.slice(0, 10).map(c => ({
        socio: `${c.prestamo?.fondoSocio?.socio?.nombres} ${c.prestamo?.fondoSocio?.socio?.apellidoPaterno}`,
        telefono: c.prestamo?.fondoSocio?.socio?.telefono,
        monto: Number(c.monto),
        fechaVencimiento: c.fechaVencimiento,
      })),
    }
  },
}
