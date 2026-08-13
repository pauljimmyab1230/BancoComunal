import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import { buildPadronFondoHtml, type PadronFondoData, type PadronSocioRow } from './padronFondoTemplate'

function formatMonto(valor: number, moneda: string): string {
  const n = valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return moneda === 'USD' ? `$ ${n}` : `S/ ${n}`
}

function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export const padronFondoPdfService = {
  async generate(fondoId: number): Promise<Buffer> {
    const fondo = await prisma.fondoRotatorio.findUnique({
      where: { id: fondoId },
      include: {
        fondosSocios: {
          include: { socio: true },
          orderBy: [{ numeroSocio: 'asc' }, { id: 'asc' }],
        },
      },
    })

    if (!fondo) throw new HttpError(404, 'Fondo no encontrado')

    const totalAportado = await prisma.aporte.aggregate({
      where: { fondoSocio: { fondoId }, estado: 'ACTIVO' },
      _sum: { monto: true },
    })

    const filas: PadronSocioRow[] = fondo.fondosSocios.map((fs, index) => ({
      numero: index + 1,
      numeroSocio: fs.numeroSocio != null ? String(fs.numeroSocio) : '—',
      dni: fs.socio.dni,
      apellidoPaterno: fs.socio.apellidoPaterno.toUpperCase(),
      apellidoMaterno: fs.socio.apellidoMaterno.toUpperCase(),
      nombres: fs.socio.nombres.toUpperCase(),
      cargo: fs.cargo?.toUpperCase() || '—',
      ingreso: formatFecha(fs.fechaIngreso),
      estado: fs.socio.estado === 'A' ? 'ACTIVO' : 'INACTIVO',
    }))

    const activos = filas.filter((f) => f.estado === 'ACTIVO').length
    const retirados = filas.filter((f) => f.estado === 'INACTIVO').length

    const estadoFondo = (() => {
      switch (fondo.estado) {
        case 'ACTIVO': return 'Activo'
        case 'INACTIVO': return 'Inactivo'
        case 'CERRADO': return 'Cerrado'
        default: return fondo.estado
      }
    })()

    const data: PadronFondoData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Registro solidario de ahorro y crédito',
      fechaEmision: formatFecha(new Date()),
      nombreFondo: fondo.nombre.toUpperCase(),
      monedaLabel: fondo.moneda === 'USD' ? 'DÓLARES (USD)' : 'SOLES (PEN)',
      capitalInicial: formatMonto(Number(fondo.capitalInicial), fondo.moneda),
      estadoFondo,
      totalSocios: filas.length,
      activos,
      retirados,
      totalAportado: formatMonto(Number(totalAportado._sum.monto || 0), fondo.moneda),
      filas,
    }

    const html = buildPadronFondoHtml(data)
    return renderHtmlToPdf(html)
  },
}
