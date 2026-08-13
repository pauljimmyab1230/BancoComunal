import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import { buildCreditosSocioHtml, type CreditosSocioData, type CreditoGrupo, type CreditoItem } from './creditosSocioTemplate'

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

export const creditosPdfService = {
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

    const prestamos = await prisma.prestamo.findMany({
      where: whereFondo,
      include: {
        fondoSocio: { include: { fondo: true } },
        cuotas: { orderBy: { numero: 'asc' } },
      },
      orderBy: [
        { fondoSocio: { fondoId: 'asc' } },
        { fechaDesembolso: 'asc' },
      ],
    })

    // Agrupar por fondo preservando el orden.
    const gruposMap = new Map<number, { nombre: string; moneda: string; items: CreditoItem[] }>()
    const subtotales = new Map<number, number>()
    const order: number[] = []
    for (const p of prestamos) {
      const fondo = p.fondoSocio.fondo
      if (!gruposMap.has(fondo.id)) {
        gruposMap.set(fondo.id, { nombre: fondo.nombre, moneda: fondo.moneda, items: [] })
        subtotales.set(fondo.id, 0)
        order.push(fondo.id)
      }
      const monto = Number(p.monto)
      if (p.estado !== 'ANULADO') subtotales.set(fondo.id, subtotales.get(fondo.id)! + monto)
      const pagadas = p.cuotas.filter((c) => c.estado === 'PAGADO').length
      const saldoPendiente = p.cuotas
        .filter((c) => c.estado !== 'PAGADO' && c.estado !== 'ANULADO')
        .reduce((acc, c) => acc + Number(c.saldoPendiente), 0)
      gruposMap.get(fondo.id)!.items.push({
        fecha: formatFecha(p.fechaDesembolso),
        monto: formatMonto(monto, fondo.moneda),
        tasa: `${Number(p.tasaInteres)}%`,
        cuotas: String(p.numeroCuotas),
        pagadas: `${pagadas}/${p.numeroCuotas}`,
        saldoPendiente: formatMonto(saldoPendiente, fondo.moneda),
        estado: p.estado,
      })
    }

    const grupos: CreditoGrupo[] = order.map((fondoId) => {
      const g = gruposMap.get(fondoId)!
      return {
        fondo: g.nombre,
        moneda: g.moneda,
        items: g.items,
        subtotal: formatMonto(subtotales.get(fondoId) ?? 0, g.moneda),
      }
    })

    const total = prestamos.filter((p) => p.estado !== 'ANULADO').reduce((acc, p) => acc + Number(p.monto), 0)
    const monedaTotal = prestamos[0]?.fondoSocio.fondo.moneda ?? 'PEN'

    const fondoSocioHeader = fondoId !== undefined
      ? socio.fondosSocios.find((fs) => fs.fondoId === fondoId)
      : socio.fondosSocios.find((fs) => fs.fondo.estado === 'ACTIVO') ?? socio.fondosSocios[0]

    const data: CreditosSocioData = {
      organizacion: fondoSocioHeader?.fondo.nombre ?? 'Banquito 2.0',
      lema: fondoSocioHeader?.fondo.organizacion?.trim() || 'Bancos comunitarios',
      fechaEmision: formatFecha(new Date()),
      nombreCompleto: `${socio.apellidoPaterno} ${socio.apellidoMaterno} ${socio.nombres}`.toUpperCase(),
      dni: socio.dni,
      codigo: socio.codigo.toUpperCase(),
      grupos,
      total: formatMonto(total, monedaTotal),
    }

    const html = buildCreditosSocioHtml(data)
    return renderHtmlToPdf(html)
  },
}
