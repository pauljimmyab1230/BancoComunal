import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import { buildComprobanteAporteHtml, type ComprobanteAporteData } from './comprobanteAporteTemplate'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const tipoLabel: Record<string, string> = {
  OBLIGATORIO: 'Aporte Obligatorio',
  EXTRAORDINARIO: 'Aporte Extraordinario',
  VOLUNTARIO: 'Aporte Voluntario',
  MULTA: 'Multa',
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

const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO',
  'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO',
  'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
]
const DECENAS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function tresDigitos(n: number): string {
  const c = Math.floor(n / 100)
  const resto = n % 100
  let resultado = ''
  if (c > 0) {
    resultado += c === 1 && resto === 0 ? 'CIEN' : CENTENAS[c]
  }
  if (resto > 0) {
    resultado += (resultado ? ' ' : '') + (resto <= 29 ? UNIDADES[resto] : DECENAS[Math.floor(resto / 10)] + (resto % 10 > 0 ? ` Y ${UNIDADES[resto % 10]}` : ''))
  }
  return resultado
}

function numeroEnPalabras(n: number): string {
  if (n === 0) return 'CERO'
  let resultado = ''
  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1_000)
  const resto = n % 1_000
  if (millones > 0) {
    resultado += millones === 1 ? 'UN MILLÓN' : `${numeroEnPalabras(millones)} MILLONES`
  }
  if (miles > 0) {
    resultado += (resultado ? ' ' : '') + (miles === 1 ? 'MIL' : `${tresDigitos(miles)} MIL`)
  }
  if (resto > 0) {
    resultado += (resultado ? ' ' : '') + tresDigitos(resto)
  }
  return resultado
}

function montoEnLetras(monto: number, moneda: string): string {
  const entero = Math.floor(Math.abs(monto))
  const centimos = Math.round((Math.abs(monto) - entero) * 100)
  const palabra = numeroEnPalabras(entero)
  const unidad = moneda === 'USD' ? 'DÓLARES' : 'SOLES'
  return `SON: ${palabra} Y ${String(centimos).padStart(2, '0')}/100 ${unidad}`
}

export const comprobanteAportePdfService = {
  async generate(aporteId: number): Promise<Buffer> {
    const aporte = await prisma.aporte.findUnique({
      where: { id: aporteId },
      include: {
        fondoSocio: {
          include: { socio: true, fondo: true },
        },
      },
    })

    if (!aporte) throw new HttpError(404, 'Aporte no encontrado')

    const fondo = aporte.fondoSocio.fondo
    const socio = aporte.fondoSocio.socio

    const caja = await prisma.caja.findFirst({ where: { fondoId: fondo.id, tipo: 'PRINCIPAL' } })
      ?? await prisma.caja.findFirst({ where: { fondoId: fondo.id } })

    const moneda = fondo.moneda
    const monto = Number(aporte.monto)
    const concepto = tipoLabel[aporte.tipo] || aporte.tipo

    const [yy, mm] = (aporte.periodo || '').split('-')
    const mesNombre = mm ? MESES[Number(mm) - 1] || '' : ''
    const descripcion = yy && mesNombre
      ? `${concepto.toLowerCase()} del socio correspondiente al período ${mesNombre} ${yy}.`
      : `${concepto.toLowerCase()} registrado del socio.`

    const referencia = `FONDO ${fondo.id}${aporte.comprobante ? ` · ${aporte.comprobante}` : ''}`

    const data: ComprobanteAporteData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Registro solidario de ahorro y crédito',
      numeroComprobante: String(aporte.id).padStart(6, '0'),
      fecha: formatFecha(aporte.fechaAporte),
      socio: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
      dni: socio.dni,
      caja: caja?.nombre?.toUpperCase() || `CAJA ${fondo.nombre}`.toUpperCase(),
      concepto,
      periodo: aporte.periodo,
      metodoPago: metodoPagoLabel[aporte.metodoPago] || aporte.metodoPago,
      referencia,
      descripcion,
      montoLetras: montoEnLetras(monto, moneda),
      monto: formatMonto(monto, moneda),
      observaciones: aporte.observacion?.trim() || '',
    }

    const html = buildComprobanteAporteHtml(data)
    return renderHtmlToPdf(html)
  },
}
