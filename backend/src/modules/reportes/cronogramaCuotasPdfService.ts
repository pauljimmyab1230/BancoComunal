import prisma from '../../config/prisma'
import { HttpError } from '../../middeware/httpError'
import { renderHtmlToPdf } from './pdfService'
import {
  buildCronogramaCuotasHtml,
  type CronogramaCuotasData,
  type CronogramaCuotaEstado,
  type CronogramaCuotaRow,
} from './cronogramaCuotasTemplate'

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

function estadoCuota(cuota: { estado: string }): CronogramaCuotaEstado {
  switch (cuota.estado) {
    case 'PAGADO':
    case 'PARCIAL':
    case 'VENCIDO':
    case 'ANULADO':
      return cuota.estado
    default:
      return 'PENDIENTE'
  }
}

export const cronogramaCuotasPdfService = {
  async generate(prestamoId: number): Promise<Buffer> {
    const prestamo = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: {
        fondoSocio: {
          include: { socio: true, fondo: true },
        },
        cuotas: { orderBy: { numero: 'asc' } },
      },
    })

    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')

    const moneda = prestamo.fondoSocio.fondo.moneda
    const socio = prestamo.fondoSocio.socio
    const fondo = prestamo.fondoSocio.fondo

    const filas: CronogramaCuotaRow[] = prestamo.cuotas.map((c) => ({
      numero: c.numero,
      fechaVencimiento: formatFecha(c.fechaVencimiento),
      interes: formatMonto(Number(c.interes), moneda),
      amortizacion: formatMonto(Number(c.amortizacion), moneda),
      cuota: formatMonto(Number(c.monto), moneda),
      saldo: formatMonto(Number(c.saldo), moneda),
      pagado: formatMonto(Number(c.montoPagado), moneda),
      pendiente: formatMonto(Number(c.saldoPendiente), moneda),
      estado: estadoCuota(c),
    }))

    const totalAmortizacion = Math.round(prestamo.cuotas.reduce((a, c) => a + Number(c.amortizacion), 0) * 100) / 100
    const totalCuota = Math.round(prestamo.cuotas.reduce((a, c) => a + Number(c.monto), 0) * 100) / 100
    const totalPagado = Math.round(prestamo.cuotas.reduce((a, c) => a + Number(c.montoPagado), 0) * 100) / 100
    const totalPendiente = Math.round(prestamo.cuotas.reduce((a, c) => a + Number(c.saldoPendiente), 0) * 100) / 100

    const estadoPrestamo = (() => {
      switch (prestamo.estado) {
        case 'ACTIVO': return 'Activo'
        case 'PAGADO': return 'Pagado'
        case 'ANULADO': return 'Anulado'
        default: return prestamo.estado
      }
    })()

    const ultimaCuota = prestamo.cuotas[prestamo.cuotas.length - 1]

    const data: CronogramaCuotasData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Registro solidario de ahorro y crédito',
      prestamoNumero: String(prestamo.id).padStart(4, '0'),
      socio: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
      dni: socio.dni,
      fondo: fondo.nombre.toUpperCase(),
      estadoPrestamo,
      monto: formatMonto(Number(prestamo.monto), moneda),
      tasa: `${Number(prestamo.tasaInteres)}%`,
      numeroCuotas: prestamo.numeroCuotas,
      cuotaMensual: formatMonto(Number(prestamo.montoCuota), moneda),
      totalInteres: formatMonto(Number(prestamo.totalInteres), moneda),
      totalPagar: formatMonto(Number(prestamo.monto) + Number(prestamo.totalInteres), moneda),
      fechaDesembolso: formatFecha(prestamo.fechaDesembolso),
      fechaPrimerVencimiento: formatFecha(prestamo.fechaPrimerVencimiento),
      fechaUltimaCuota: ultimaCuota ? formatFecha(ultimaCuota.fechaVencimiento) : '—',
      filas,
      totalAmortizacion: formatMonto(totalAmortizacion, moneda),
      totalCuota: formatMonto(totalCuota, moneda),
      totalPagado: formatMonto(totalPagado, moneda),
      totalPendiente: formatMonto(totalPendiente, moneda),
      observaciones: '',
    }

    const html = buildCronogramaCuotasHtml(data)
    return renderHtmlToPdf(html)
  },
}
