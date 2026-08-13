import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import {
  buildEstadoCuentaHtml,
  type EstadoCuentaData,
  type AporteGrupoItem,
  type PrestamoItem,
  type CuotaItem,
  type MovimientoItem,
} from './estadoCuentaTemplate'

const MESES_CORTES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const CONCEPTOS: Record<string, string> = {
  OBLIGATORIO: 'Aportes Obligatorios',
  VOLUNTARIO: 'Aportes Voluntarios',
  EXTRAORDINARIO: 'Aportes Extraordinarios',
  MULTA: 'Multas',
}

function formatMonto(valor: number, moneda: string): string {
  const n = valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return moneda === 'USD' ? `$ ${n}` : `S/ ${n}`
}

function formatFecha(fecha: Date | string): string {
  const d = new Date(fecha)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function conceptoTipo(tipo: string): string {
  return CONCEPTOS[tipo] ?? tipo
}

function inicioDeDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export const estadoCuentaPdfService = {
  async generate(socioId: number, fondoId?: number): Promise<Buffer> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        fondosSocios: {
          include: { fondo: true },
          orderBy: { fechaIngreso: 'asc' },
        },
      },
    })

    if (!socio) throw new HttpError(404, 'Socio no encontrado')

    let fondoSocio = fondoId !== undefined
      ? socio.fondosSocios.find((fs) => fs.fondoId === fondoId)
      : socio.fondosSocios.find((fs) => fs.fondo.estado === 'ACTIVO') ?? socio.fondosSocios[0]

    if (!fondoSocio) throw new HttpError(400, 'El socio no pertenece a un fondo rotatorio')

    const fondo = fondoSocio.fondo
    const moneda = fondo.moneda

    const [aportes, prestamos] = await Promise.all([
      prisma.aporte.findMany({
        where: {
          fondoSocioId: fondoSocio.id,
          estado: { not: 'ANULADO' },
        },
        orderBy: { fechaAporte: 'asc' },
      }),
      prisma.prestamo.findMany({
        where: {
          fondoSocioId: fondoSocio.id,
          estado: { not: 'ANULADO' },
        },
        include: {
          cuotas: { orderBy: { numero: 'asc' } },
        },
        orderBy: { fechaDesembolso: 'asc' },
      }),
    ])

    const corte = new Date()
    const corteInicio = inicioDeDia(corte)

    // ---------- Resumen general ----------
    let capitalAportado = 0
    for (const a of aportes) {
      if (a.tipo !== 'MULTA') capitalAportado += Number(a.monto)
    }
    const multas = aportes.filter((a) => a.tipo === 'MULTA').reduce((acc, a) => acc + Number(a.monto), 0)

    let saldoPrestamos = 0
    let interesesPagar = 0
    for (const p of prestamos) {
      for (const c of p.cuotas) {
        if (c.estado === 'PAGADO' || c.estado === 'ANULADO') continue
        saldoPrestamos += Number(c.saldoPendiente)
        interesesPagar += Number(c.interes)
      }
    }
    const saldoNeto = capitalAportado - (saldoPrestamos + interesesPagar)

    // ---------- I. Aportes por año ----------
    const anioCorte = corte.getFullYear()
    const mesCorte = MESES_CORTES[corte.getMonth()]
    const gruposPorAnio = new Map<number, { conceptos: Set<string>; numero: number; monto: number; multas: number }>()

    for (const a of aportes) {
      const anio = Number(a.periodo.slice(0, 4))
      if (!gruposPorAnio.has(anio)) {
        gruposPorAnio.set(anio, { conceptos: new Set(), numero: 0, monto: 0, multas: 0 })
      }
      const grupo = gruposPorAnio.get(anio)!
      if (a.tipo === 'MULTA') {
        grupo.multas += Number(a.monto)
      } else {
        grupo.numero += 1
        grupo.monto += Number(a.monto)
        grupo.conceptos.add(conceptoTipo(a.tipo))
      }
    }

    const anios = [...gruposPorAnio.keys()].sort((x, y) => x - y)
    const aportesItems: AporteGrupoItem[] = anios.map((anio) => {
      const g = gruposPorAnio.get(anio)!
      const periodo = anio === anioCorte ? `${anio} (ene–${mesCorte})` : String(anio)
      const concepto = [...g.conceptos].sort().join(' / ') || 'Multas'
      return {
        periodo,
        concepto,
        numero: String(g.numero),
        monto: formatMonto(g.monto, moneda),
        multas: formatMonto(g.multas, moneda),
      }
    })

    const aporteTotal = {
      numero: String(aportesItems.reduce((acc, i) => acc + Number(i.numero), 0)),
      monto: formatMonto(capitalAportado, moneda),
      multas: formatMonto(multas, moneda),
    }

    // ---------- II. Préstamos ----------
    const numPrestamo = new Map<number, number>()
    const prestamoItems: PrestamoItem[] = prestamos.map((p, idx) => {
      numPrestamo.set(p.id, idx + 1)
      const pagadas = p.cuotas.filter((c) => c.estado === 'PAGADO')
      const pendientes = p.cuotas.filter((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO')
      const pagado = p.cuotas.reduce((acc, c) => acc + Number(c.montoPagado), 0)
      const saldo = pendientes.reduce((acc, c) => acc + Number(c.saldoPendiente), 0)
      const cancelado = p.estado === 'PAGADO' || (p.numeroCuotas > 0 && pagadas.length === p.numeroCuotas)
      return {
        numero: String(idx + 1),
        fecha: formatFecha(p.fechaDesembolso),
        monto: formatMonto(Number(p.monto), moneda),
        pagado: formatMonto(pagado, moneda),
        saldo: formatMonto(saldo, moneda),
        cuotas: `${pagadas.length} / ${p.numeroCuotas}`,
        estado: cancelado ? 'CANCELADO' : 'ACTIVO',
      }
    })

    const prestamoTotal = {
      monto: formatMonto(prestamos.reduce((acc, p) => acc + Number(p.monto), 0), moneda),
      pagado: formatMonto(prestamos.reduce((acc, p) => acc + p.cuotas.reduce((s, c) => s + Number(c.montoPagado), 0), 0), moneda),
      saldo: formatMonto(prestamos.reduce((acc, p) => acc + p.cuotas.filter((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO').reduce((s, c) => s + Number(c.saldoPendiente), 0), 0), moneda),
      cuotas: `${prestamos.reduce((acc, p) => acc + p.cuotas.filter((c) => c.estado === 'PAGADO').length, 0)} / ${prestamos.reduce((acc, p) => acc + p.numeroCuotas, 0)}`,
    }

    // ---------- III. Cuotas próximas por pagar ----------
    const cuotasPendientes: { p: typeof prestamos[number]; c: typeof prestamos[number]['cuotas'][number] }[] = []
    for (const p of prestamos) {
      for (const c of p.cuotas) {
        if (c.estado === 'PAGADO' || c.estado === 'ANULADO') continue
        cuotasPendientes.push({ p, c })
      }
    }
    cuotasPendientes.sort((a, b) => a.c.fechaVencimiento.getTime() - b.c.fechaVencimiento.getTime())

    const cuotaItems: CuotaItem[] = cuotasPendientes.map(({ p, c }) => ({
      prestamo: String(numPrestamo.get(p.id) ?? ''),
      numero: String(c.numero),
      vencimiento: formatFecha(c.fechaVencimiento),
      interes: formatMonto(Number(c.interes), moneda),
      capital: formatMonto(Number(c.amortizacion), moneda),
      total: formatMonto(Number(c.monto), moneda),
      estado: inicioDeDia(c.fechaVencimiento) < corteInicio ? 'VENCIDA' : 'PENDIENTE',
    }))

    const cuotaTotal = {
      interes: formatMonto(cuotasPendientes.reduce((acc, { c }) => acc + Number(c.interes), 0), moneda),
      capital: formatMonto(cuotasPendientes.reduce((acc, { c }) => acc + Number(c.amortizacion), 0), moneda),
      total: formatMonto(cuotasPendientes.reduce((acc, { c }) => acc + Number(c.monto), 0), moneda),
    }

    // ---------- IV. Movimientos ----------
    const movimientosRaw: { fecha: Date; descripcion: string; concepto: string; tipo: 'I' | 'E'; monto: number }[] = []
    for (const a of aportes) {
      const desc = a.tipo === 'MULTA'
        ? `Multa por morosidad período ${a.periodo}`
        : `Aporte ${conceptoTipo(a.tipo).replace('Aportes ', '').toLowerCase()} período ${a.periodo}`
      movimientosRaw.push({ fecha: a.fechaAporte, descripcion: desc, concepto: 'Aporte', tipo: 'I', monto: Number(a.monto) })
    }
    for (const p of prestamos) {
      const n = numPrestamo.get(p.id) ?? ''
      movimientosRaw.push({ fecha: p.fechaDesembolso, descripcion: `Desembolso préstamo N° ${n}`, concepto: 'Préstamo', tipo: 'E', monto: Number(p.monto) })
      for (const c of p.cuotas) {
        if (c.fechaPago && Number(c.montoPagado) > 0) {
          movimientosRaw.push({ fecha: c.fechaPago, descripcion: `Cuota ${c.numero} de préstamo N° ${n}`, concepto: 'Pago de Cuota', tipo: 'I', monto: Number(c.montoPagado) })
        }
      }
    }
    movimientosRaw.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

    const movimientos: MovimientoItem[] = movimientosRaw.map((m) => ({
      fecha: formatFecha(m.fecha),
      descripcion: m.descripcion,
      concepto: m.concepto,
      ingreso: m.tipo === 'I' ? formatMonto(m.monto, moneda) : '—',
      egreso: m.tipo === 'E' ? formatMonto(m.monto, moneda) : '—',
    }))

    const totalIngresos = movimientosRaw.filter((m) => m.tipo === 'I').reduce((acc, m) => acc + m.monto, 0)
    const totalEgresos = movimientosRaw.filter((m) => m.tipo === 'E').reduce((acc, m) => acc + m.monto, 0)

    const data: EstadoCuentaData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Bancos comunitarios',
      corteAl: formatFecha(corte),
      nombreCompleto: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
      dni: socio.dni,
      fondo: fondo.nombre.toUpperCase(),
      resumen: {
        capitalAportado: formatMonto(capitalAportado, moneda),
        saldoPrestamos: formatMonto(saldoPrestamos, moneda),
        interesesPagar: formatMonto(interesesPagar, moneda),
        saldoNeto: formatMonto(saldoNeto, moneda),
      },
      aportes: aportesItems,
      aporteTotal,
      prestamos: prestamoItems,
      prestamoTotal,
      cuotas: cuotaItems,
      cuotaTotal,
      movimientos,
      movimientoTotal: {
        ingreso: formatMonto(totalIngresos, moneda),
        egreso: formatMonto(totalEgresos, moneda),
      },
    }

    const html = buildEstadoCuentaHtml(data)
    return renderHtmlToPdf(html)
  },
}
