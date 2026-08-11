import prisma from '../../config/prisma'
import { HttpError } from '../../middeware/httpError'
import { renderHtmlToPdf } from './pdfService'
import { buildAportesSocioHtml, type AportesSocioData, type AporteGrupo, type AporteItem } from './aportesSocioTemplate'

const tipoLabel: Record<string, string> = {
  OBLIGATORIO: 'Obligatorio',
  EXTRAORDINARIO: 'Extraordinario',
  VOLUNTARIO: 'Voluntario',
  MULTA: 'Multa',
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

export const aportesPdfService = {
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

    const whereFondo: any = { fondoSocio: { socioId } }
    if (fondoId !== undefined) {
      const pertenece = socio.fondosSocios.some((fs) => fs.fondoId === fondoId)
      if (!pertenece) throw new HttpError(400, 'El socio no pertenece a ese fondo')
      whereFondo.fondoSocio.fondoId = fondoId
    }

    const aportes = await prisma.aporte.findMany({
      where: whereFondo,
      include: { fondoSocio: { include: { fondo: true } } },
      orderBy: [
        { fondoSocio: { fondoId: 'asc' } },
        { fechaAporte: 'asc' },
      ],
    })

    // Agrupar por fondo preservando el orden (fechaAporte ascendente dentro de cada grupo).
    const gruposMap = new Map<number, { nombre: string; moneda: string; items: AporteItem[] }>()
    const subtotales = new Map<number, number>()
    const order: number[] = []
    for (const a of aportes) {
      const fondo = a.fondoSocio.fondo
      if (!gruposMap.has(fondo.id)) {
        gruposMap.set(fondo.id, { nombre: fondo.nombre, moneda: fondo.moneda, items: [] })
        subtotales.set(fondo.id, 0)
        order.push(fondo.id)
      }
      const monto = Number(a.monto)
      if (a.estado === 'ACTIVO') subtotales.set(fondo.id, subtotales.get(fondo.id)! + monto)
      gruposMap.get(fondo.id)!.items.push({
        tipo: tipoLabel[a.tipo] || a.tipo,
        periodo: a.periodo,
        fecha: formatFecha(a.fechaAporte),
        monto: formatMonto(monto, fondo.moneda),
        estado: a.estado === 'ANULADO' ? 'ANULADO' : 'ACTIVO',
      })
    }

    const grupos: AporteGrupo[] = order.map((fondoId) => {
      const g = gruposMap.get(fondoId)!
      return {
        fondo: g.nombre,
        moneda: g.moneda,
        items: g.items,
        subtotal: formatMonto(subtotales.get(fondoId) ?? 0, g.moneda),
      }
    })

    const total = aportes.filter((a) => a.estado === 'ACTIVO').reduce((acc, a) => acc + Number(a.monto), 0)
    const monedaTotal = aportes[0]?.fondoSocio.fondo.moneda ?? 'PEN'

    const fondoSocioHeader = fondoId !== undefined
      ? socio.fondosSocios.find((fs) => fs.fondoId === fondoId)
      : socio.fondosSocios.find((fs) => fs.fondo.estado === 'ACTIVO') ?? socio.fondosSocios[0]

    const data: AportesSocioData = {
      organizacion: fondoSocioHeader?.fondo.nombre ?? 'Banquito 2.0',
      lema: fondoSocioHeader?.fondo.organizacion?.trim() || 'Bancos comunitarios',
      fechaEmision: formatFecha(new Date()),
      nombreCompleto: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
      dni: socio.dni,
      codigo: socio.codigo.toUpperCase(),
      grupos,
      total: formatMonto(total, monedaTotal),
    }

    const html = buildAportesSocioHtml(data)
    return renderHtmlToPdf(html)
  },
}
