import prisma from '../../config/prisma'
import { marcarCuotasVencidas } from '../creditos/creditoService'
import { logger } from '../../config/logger'

export const dashboardService = {
  async getSummary() {
    await marcarCuotasVencidas()

    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

    const [
      totalSocios,
      sociosActivos,
      totalFondos,
      fondosActivos,
      prestamos,
      cuotasProximas,
      aportesMes,
      aportesSemana,
      cajas,
    ] = await Promise.all([
      prisma.socio.count(),
      prisma.socio.count({ where: { estado: 'A' } }),
      prisma.fondoRotatorio.count(),
      prisma.fondoRotatorio.count({ where: { estado: 'ACTIVO' } }),
      prisma.prestamo.findMany({
        where: { estado: 'ACTIVO' },
        select: {
          id: true,
          monto: true,
          tasaInteres: true,
          fechaDesembolso: true,
          fondoSocio: {
            select: {
              socio: { select: { id: true, codigo: true, nombres: true, apellidoPaterno: true } },
              fondo: { select: { id: true, nombre: true } },
            },
          },
          cuotas: {
            select: {
              monto: true,
              amortizacion: true,
              montoPagado: true,
              saldoPendiente: true,
              estado: true,
              fechaVencimiento: true,
              numero: true,
            },
          },
        },
      }),
      prisma.cuotaPrestamo.findMany({
        where: {
          estado: { notIn: ['PAGADO'] },
          fechaVencimiento: { gte: hoy, lte: new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000) },
        },
        include: {
          prestamo: {
            select: {
              fondoSocio: {
                select: {
                  socio: {
                    select: { id: true, nombres: true, apellidoPaterno: true, telefono: true },
                  },
                  fondo: { select: { nombre: true } },
                },
              },
            },
          },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
      prisma.aporte.findMany({
        where: { estado: 'ACTIVO', fechaAporte: { gte: inicioMes } },
        select: { monto: true, tipo: true, fechaAporte: true },
      }),
      prisma.aporte.findMany({
        where: { estado: 'ACTIVO', fechaAporte: { gte: inicioSemana } },
        select: { monto: true },
      }),
      prisma.caja.findMany({
        where: { estado: 'ACTIVA' },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          saldoActual: true,
          tipo: true,
          moneda: true,
        },
      }),
    ])

    let movimientosHoy: unknown[] = []
    let arqueosPendientes: unknown[] = []
    let actividadReciente: unknown[] = []

    try {
      movimientosHoy = await prisma.movimientoCaja.findMany({
        where: { fechaMovimiento: { gte: inicioDia } },
        include: {
          caja: { select: { nombre: true } },
          concepto: { select: { nombre: true } },
        },
        orderBy: { fechaMovimiento: 'desc' },
        take: 10,
      })
    } catch (error) {
      logger.error('[Dashboard] Error al obtener movimientos del día:', error)
    }

    try {
      arqueosPendientes = await prisma.arqueoCaja.findMany({
        where: { estado: 'PENDIENTE' },
        include: { caja: { select: { nombre: true } } },
        orderBy: { fechaArqueo: 'desc' },
      })
    } catch (error) {
      logger.error('[Dashboard] Error al obtener arqueos pendientes:', error)
    }

    try {
      actividadReciente = await prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      logger.error('[Dashboard] Error al obtener actividad reciente:', error)
    }

    const capitalPrestado = prestamos.reduce((a, p) => a + Number(p.monto), 0)
    // Solo la parte de amortización (capital) recuperada; el interés no es capital.
    const capitalRecuperado =
      Math.round(
        prestamos.reduce(
          (a, p) =>
            a +
            p.cuotas.reduce((b, c) => {
              const cMonto = Number(c.monto)
              const cPagado = Number(c.montoPagado)
              if (cPagado <= 0) return b
              const proporcion = cMonto > 0 ? Math.min(1, cPagado / cMonto) : 1
              return b + Number(c.amortizacion) * proporcion
            }, 0),
          0
        ) * 100
      ) / 100
    const saldoPendiente = prestamos.reduce(
      (a, p) => a + p.cuotas.reduce((b, c) => b + Number(c.saldoPendiente), 0),
      0
    )
    const cuotasVencidas = prestamos.reduce(
      (a, p) => a + p.cuotas.filter((c) => c.estado === 'VENCIDO' || c.estado === 'PARCIAL').length,
      0
    )
    const totalCuotasActivas = prestamos.reduce(
      (a, p) => a + p.cuotas.filter((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO').length,
      0
    )
    const tasaMorosidad = totalCuotasActivas > 0 ? (cuotasVencidas / totalCuotasActivas) * 100 : 0
    const totalSaldoCajas = cajas.reduce((a, c) => a + Number(c.saldoActual), 0)
    const totalSaldoCajasPorMoneda = cajas.reduce(
      (acc, c) => {
        const moneda = c.moneda || 'PEN'
        acc[moneda] = (acc[moneda] || 0) + Number(c.saldoActual)
        return acc
      },
      {} as Record<string, number>
    )
    const aportesMesMonto = aportesMes.reduce((a, ap) => a + Number(ap.monto), 0)
    const aportesSemanaMonto = aportesSemana.reduce((a, ap) => a + Number(ap.monto), 0)
    const aportesPorTipo = aportesMes.reduce(
      (acc, ap) => {
        acc[ap.tipo] = (acc[ap.tipo] || 0) + Number(ap.monto)
        return acc
      },
      {} as Record<string, number>
    )

    const prestamosTop5 = prestamos
      .map((p) => {
        const totalPagado = p.cuotas.reduce((a, c) => a + Number(c.montoPagado), 0)
        const saldo = p.cuotas.reduce((a, c) => a + Number(c.saldoPendiente), 0)
        const cuotasPagadas = p.cuotas.filter((c) => c.estado === 'PAGADO').length
        return {
          id: p.id,
          socio: p.fondoSocio?.socio ?? null,
          fondo: p.fondoSocio?.fondo ?? null,
          monto: Number(p.monto),
          totalPagado,
          saldoPendiente: saldo,
          cuotasPagadas,
          totalCuotas: p.cuotas.length,
        }
      })
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente)
      .slice(0, 5)

    return {
      resumen: {
        totalSocios,
        sociosActivos,
        totalFondos,
        fondosActivos,
        creditosActivos: prestamos.length,
        capitalPrestado,
        capitalRecuperado,
        saldoPendienteCartera: saldoPendiente,
        cuotasVencidas,
        tasaMorosidad,
        totalSaldoCajas,
        totalSaldoCajasPorMoneda,
        aportesMes: aportesMesMonto,
        aportesSemana: aportesSemanaMonto,
        cantidadAportesMes: aportesMes.length,
        aportesPorTipo,
      },
      cajas,
      movimientosHoy,
      cuotasProximas: cuotasProximas.slice(0, 10).map((c) => ({
        socio: `${c.prestamo?.fondoSocio?.socio?.nombres} ${c.prestamo?.fondoSocio?.socio?.apellidoPaterno}`,
        telefono: c.prestamo?.fondoSocio?.socio?.telefono,
        fondo: c.prestamo?.fondoSocio?.fondo?.nombre,
        monto: Number(c.monto),
        saldoPendiente: Number(c.saldoPendiente),
        fechaVencimiento: c.fechaVencimiento,
      })),
      arqueosPendientes,
      prestamosTop5,
      actividadReciente,
    }
  },

  /**
   * Series históricas mensuales para los gráficos de evolución del dashboard.
   * Agrupa los últimos `meses` (por defecto 12) por mes calendario.
   */
  async getEvolucion(meses = 12) {
    const hoy = new Date()
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1)

    const buckets: { etiqueta: string; inicio: Date; fin: Date }[] = []
    for (let i = 0; i < meses; i++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1)
      buckets.push({
        etiqueta: d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }),
        inicio: d,
        fin: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      })
    }

    const [movimientos, aportes, prestamos, sociosNuevos, cuotasVencidas] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where: { fechaMovimiento: { gte: inicio }, estado: { not: 'ANULADO' } },
        select: { tipo: true, monto: true, fechaMovimiento: true },
      }),
      prisma.aporte.findMany({
        where: { fechaAporte: { gte: inicio }, estado: 'ACTIVO' },
        select: { monto: true, fechaAporte: true },
      }),
      prisma.prestamo.findMany({
        where: { fechaDesembolso: { gte: inicio }, estado: { not: 'ANULADO' } },
        select: { monto: true, fechaDesembolso: true },
      }),
      prisma.socio.findMany({
        where: { fechaIngreso: { gte: inicio } },
        select: { fechaIngreso: true },
        orderBy: { fechaIngreso: 'asc' },
      }),
      prisma.cuotaPrestamo.findMany({
        where: { estado: { in: ['VENCIDO', 'PARCIAL'] } },
        select: {
          saldoPendiente: true,
          prestamo: { select: { fondoSocio: { select: { fondo: { select: { nombre: true } } } } } },
        },
      }),
    ])

    const redondear = (n: number) => Math.round(n * 100) / 100

    const enRango = (fecha: Date, b: { inicio: Date; fin: Date }) =>
      fecha >= b.inicio && fecha < b.fin

    const ingresosEgresos = buckets.map((b) => {
      let ingresos = 0
      let egresos = 0
      for (const m of movimientos) {
        if (!enRango(m.fechaMovimiento, b)) continue
        if (m.tipo === 'INGRESO') ingresos += Number(m.monto)
        else if (m.tipo === 'EGRESO') egresos += Number(m.monto)
      }
      return {
        etiqueta: b.etiqueta,
        ingresos: redondear(ingresos),
        egresos: redondear(egresos),
        neto: redondear(ingresos - egresos),
      }
    })

    const aportesPorMes = buckets.map((b) => {
      let monto = 0
      let cantidad = 0
      for (const a of aportes) {
        if (enRango(a.fechaAporte, b)) {
          monto += Number(a.monto)
          cantidad++
        }
      }
      return { etiqueta: b.etiqueta, monto: redondear(monto), cantidad }
    })

    const desembolsosPorMes = buckets.map((b) => {
      let monto = 0
      let cantidad = 0
      for (const p of prestamos) {
        if (enRango(p.fechaDesembolso, b)) {
          monto += Number(p.monto)
          cantidad++
        }
      }
      return { etiqueta: b.etiqueta, monto: redondear(monto), cantidad }
    })

    const altasSocios = buckets.map((b) => {
      const cantidad = sociosNuevos.filter((s) => enRango(s.fechaIngreso, b)).length
      return { etiqueta: b.etiqueta, cantidad }
    })

    const porFondo: Record<string, { vencidas: number; montoAdeudado: number }> = {}
    for (const c of cuotasVencidas) {
      const nombre = c.prestamo?.fondoSocio?.fondo?.nombre ?? 'Sin fondo'
      porFondo[nombre] = porFondo[nombre] ?? { vencidas: 0, montoAdeudado: 0 }
      porFondo[nombre].vencidas++
      porFondo[nombre].montoAdeudado += Number(c.saldoPendiente)
    }
    const morosidadPorFondo = Object.entries(porFondo).map(([fondo, valor]) => ({
      fondo,
      vencidas: valor.vencidas,
      montoAdeudado: redondear(valor.montoAdeudado),
    }))

    return {
      periodo: { inicio: inicio.toISOString(), fin: hoy.toISOString() },
      ingresosEgresos,
      aportes: aportesPorMes,
      desembolsos: desembolsosPorMes,
      altasSocios,
      morosidadPorFondo,
    }
  },
}
