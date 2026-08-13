import { PrismaClient } from '@prisma/client'
import { marcarCuotasVencidas } from '../creditos/creditoService'

const prisma = new PrismaClient()

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
      totalSocios, sociosActivos,
      totalFondos, fondosActivos,
      prestamos, cuotasProximas,
      aportesMes, aportesSemana,
      cajas,
    ] = await Promise.all([
      prisma.socio.count(),
      prisma.socio.count({ where: { estado: 'A' } }),
      prisma.fondoRotatorio.count(),
      prisma.fondoRotatorio.count({ where: { estado: 'ACTIVO' } }),
      prisma.prestamo.findMany({
        where: { estado: 'ACTIVO' },
        select: {
          id: true, monto: true, tasaInteres: true, fechaDesembolso: true,
          fondoSocio: {
            select: {
              socio: { select: { id: true, codigo: true, nombres: true, apellidoPaterno: true } },
              fondo: { select: { id: true, nombre: true } },
            },
          },
          cuotas: { select: { monto: true, amortizacion: true, montoPagado: true, saldoPendiente: true, estado: true, fechaVencimiento: true, numero: true } },
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
                  socio: { select: { id: true, nombres: true, apellidoPaterno: true, telefono: true } },
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
        select: { id: true, codigo: true, nombre: true, saldoActual: true, tipo: true, moneda: true },
      }),
    ])

    let movimientosHoy: any[] = []
    let arqueosPendientes: any[] = []
    let actividadReciente: any[] = []

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
    } catch { /* tabla puede no existir */ }

    try {
      arqueosPendientes = await prisma.arqueoCaja.findMany({
        where: { estado: 'PENDIENTE' },
        include: { caja: { select: { nombre: true } } },
        orderBy: { fechaArqueo: 'desc' },
      })
    } catch { /* tabla puede no existir */ }

    try {
      actividadReciente = await prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      })
    } catch { /* tabla AuditLog puede no existir aún */ }

    const capitalPrestado = prestamos.reduce((a, p) => a + Number(p.monto), 0)
    // Solo la parte de amortización (capital) recuperada; el interés no es capital.
    const capitalRecuperado = Math.round(prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => {
      const cMonto = Number(c.monto)
      const cPagado = Number(c.montoPagado)
      if (cPagado <= 0) return b
      const proporcion = cMonto > 0 ? Math.min(1, cPagado / cMonto) : 1
      return b + Number(c.amortizacion) * proporcion
    }, 0), 0) * 100) / 100
    const saldoPendiente = prestamos.reduce((a, p) => a + p.cuotas.reduce((b, c) => b + Number(c.saldoPendiente), 0), 0)
    const cuotasVencidas = prestamos.reduce((a, p) => a + p.cuotas.filter(c => c.estado === 'VENCIDO' || c.estado === 'PARCIAL').length, 0)
    const totalCuotasActivas = prestamos.reduce((a, p) => a + p.cuotas.filter(c => c.estado !== 'PAGADO' && c.estado !== 'ANULADO').length, 0)
    const tasaMorosidad = totalCuotasActivas > 0 ? (cuotasVencidas / totalCuotasActivas) * 100 : 0
    const totalSaldoCajas = cajas.reduce((a, c) => a + Number(c.saldoActual), 0)
    const totalSaldoCajasPorMoneda = cajas.reduce((acc, c) => {
      const moneda = c.moneda || 'PEN'
      acc[moneda] = (acc[moneda] || 0) + Number(c.saldoActual)
      return acc
    }, {} as Record<string, number>)
    const aportesMesMonto = aportesMes.reduce((a, ap) => a + Number(ap.monto), 0)
    const aportesSemanaMonto = aportesSemana.reduce((a, ap) => a + Number(ap.monto), 0)
    const aportesPorTipo = aportesMes.reduce((acc, ap) => {
      acc[ap.tipo] = (acc[ap.tipo] || 0) + Number(ap.monto)
      return acc
    }, {} as Record<string, number>)

    const prestamosTop5 = prestamos
      .map(p => {
        const totalPagado = p.cuotas.reduce((a, c) => a + Number(c.montoPagado), 0)
        const saldo = p.cuotas.reduce((a, c) => a + Number(c.saldoPendiente), 0)
        const cuotasPagadas = p.cuotas.filter(c => c.estado === 'PAGADO').length
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
      cuotasProximas: cuotasProximas.slice(0, 10).map(c => ({
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
}
