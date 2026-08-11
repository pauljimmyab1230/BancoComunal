import prisma from '../../config/prisma'
import { HttpError } from '../../middeware/httpError'
import { renderHtmlToPdf } from './pdfService'
import {
  buildAportesFondoHtml,
  type AporteFondoRow,
  type AportesFondoData,
} from './aportesFondoTemplate'

const conceptoLabel: Record<string, string> = {
  OBLIGATORIO: 'Aportes Obligatorios',
  EXTRAORDINARIO: 'Aportes Extraordinarios',
  VOLUNTARIO: 'Aportes Voluntarios',
  MULTA: 'Multas',
}

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
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

export const aportesFondoPdfService = {
  async anios(fondoId: number): Promise<number[]> {
    const fondo = await prisma.fondoRotatorio.findUnique({
      where: { id: fondoId },
      select: { id: true },
    })

    if (!fondo) throw new HttpError(404, 'Fondo no encontrado')

    const aportes = await prisma.aporte.findMany({
      where: { fondoSocio: { fondoId } },
      select: { fechaAporte: true },
    })

    const anios = new Set(aportes.map((a) => new Date(a.fechaAporte).getFullYear()))
    return [...anios].sort((a, b) => b - a)
  },

  async generate(fondoId: number, anio?: number): Promise<Buffer> {
    const fondo = await prisma.fondoRotatorio.findUnique({ where: { id: fondoId } })

    if (!fondo) throw new HttpError(404, 'Fondo no encontrado')

    const anioReporte = anio ?? new Date().getFullYear()
    const desde = new Date(anioReporte, 0, 1)
    const hasta = new Date(anioReporte, 11, 31, 23, 59, 59, 999)

    const aportes = await prisma.aporte.findMany({
      where: {
        fondoSocio: { fondoId },
        fechaAporte: { gte: desde, lte: hasta },
      },
      include: { fondoSocio: { include: { socio: true } } },
      orderBy: [{ fechaAporte: 'desc' }, { id: 'desc' }],
    })

    const moneda = fondo.moneda

    const totalAportado = Math.round(aportes
      .filter((a) => a.estado === 'ACTIVO')
      .reduce((a, x) => a + Number(x.monto), 0) * 100) / 100
    const activos = aportes.filter((a) => a.estado === 'ACTIVO').length
    const anulados = aportes.length - activos

    const estadoFondo = (() => {
      switch (fondo.estado) {
        case 'ACTIVO': return 'Activo'
        case 'INACTIVO': return 'Inactivo'
        case 'CERRADO': return 'Cerrado'
        default: return fondo.estado
      }
    })()

    const filas: AporteFondoRow[] = aportes.map((a, i) => {
      const socio = a.fondoSocio.socio
      return {
        numero: i + 1,
        socio: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
        periodo: a.periodo,
        fecha: formatFecha(a.fechaAporte),
        concepto: conceptoLabel[a.tipo] || a.tipo,
        comprobante: a.comprobante?.trim() || '—',
        metodoPago: metodoPagoLabel[a.metodoPago] || a.metodoPago,
        monto: formatMonto(Number(a.monto), moneda),
        estado: a.estado === 'ANULADO' ? 'ANULADO' : 'ACTIVO',
      }
    })

    const data: AportesFondoData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Registro solidario de ahorro y crédito',
      fechaEmision: formatFecha(new Date()),
      nombreFondo: fondo.nombre.toUpperCase(),
      monedaLabel: moneda === 'USD' ? 'DÓLARES (USD)' : 'SOLES (PEN)',
      periodo: String(anioReporte),
      estadoFondo,
      totalAportado: formatMonto(totalAportado, moneda),
      numeroAportes: aportes.length,
      activos,
      anulados,
      filas,
    }

    const html = buildAportesFondoHtml(data)
    return renderHtmlToPdf(html)
  },
}
