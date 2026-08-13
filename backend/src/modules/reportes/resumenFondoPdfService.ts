import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import {
  buildResumenFondoHtml,
  type ResumenFondoData,
  type ResumenFondoMes,
  type ResumenFondoConcepto,
} from './resumenFondoTemplate'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const conceptoLabel: Record<string, string> = {
  OBLIGATORIO: 'Aportes Obligatorios',
  EXTRAORDINARIO: 'Aportes Extraordinarios',
  VOLUNTARIO: 'Aportes Voluntarios',
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

export const resumenFondoPdfService = {
  async generate(fondoId: number): Promise<Buffer> {
    const fondo = await prisma.fondoRotatorio.findUnique({
      where: { id: fondoId },
      include: {
        fondosSocios: { include: { socio: true } },
      },
    })

    if (!fondo) throw new HttpError(404, 'Fondo no encontrado')

    const moneda = fondo.moneda

    const [aportes, prestamos, cuotasPagadas, totalActivo] = await Promise.all([
      prisma.aporte.findMany({
        where: { fondoSocio: { fondoId }, estado: 'ACTIVO' },
        select: { tipo: true, monto: true, fechaAporte: true },
      }),
      prisma.prestamo.findMany({
        where: { fondoSocio: { fondoId } },
        select: { monto: true, fechaDesembolso: true, estado: true },
      }),
      prisma.cuotaPrestamo.findMany({
        where: { prestamo: { fondoSocio: { fondoId } }, estado: 'PAGADO' },
        select: { interes: true },
      }),
      prisma.prestamo.aggregate({
        where: { fondoSocio: { fondoId }, estado: 'ACTIVO' },
        _sum: { monto: true },
      }),
    ])

    const cuotasActivas = await prisma.cuotaPrestamo.findMany({
      where: { prestamo: { fondoSocio: { fondoId }, estado: 'ACTIVO' } },
      select: { monto: true, amortizacion: true, montoPagado: true },
    })

    // Capital prestado pendiente = total desembolsado activo menos capital recuperado.
    const capitalRecuperado = Math.round(cuotasActivas.reduce((a, c) => {
      const cMonto = Number(c.monto)
      const cPagado = Number(c.montoPagado)
      if (cPagado <= 0) return a
      const proporcion = cMonto > 0 ? Math.min(1, cPagado / cMonto) : 1
      return a + Number(c.amortizacion) * proporcion
    }, 0) * 100) / 100
    const capitalPrestado = Math.round((Number(totalActivo._sum?.monto || 0) - capitalRecuperado) * 100) / 100

    const aportesFondo = Math.round(aportes.reduce((a, x) => a + Number(x.monto), 0) * 100) / 100
    const interesesGanados = Math.round(cuotasPagadas.reduce((a, c) => a + Number(c.interes), 0) * 100) / 100
    const totalFondo = Math.round((Number(fondo.capitalInicial) + aportesFondo + interesesGanados) * 100) / 100

    const sociosActivos = fondo.fondosSocios.filter((fs) => fs.socio.estado === 'A').length
    const prestamosActivos = prestamos.filter((p) => p.estado === 'ACTIVO').length

    const ano = new Date().getFullYear()
    const ingresosPorMes = Array(12).fill(0) as number[]
    const egresosPorMes = Array(12).fill(0) as number[]

    for (const a of aportes) {
      const d = new Date(a.fechaAporte)
      if (d.getFullYear() === ano) ingresosPorMes[d.getMonth()] += Number(a.monto)
    }
    for (const p of prestamos) {
      const d = new Date(p.fechaDesembolso)
      if (d.getFullYear() === ano) egresosPorMes[d.getMonth()] += Number(p.monto)
    }

    let acumulado = 0
    const movimientos: ResumenFondoMes[] = MESES.map((mes, i) => {
      acumulado += ingresosPorMes[i] - egresosPorMes[i]
      return {
        mes,
        ingresos: formatMonto(ingresosPorMes[i], moneda),
        egresos: formatMonto(egresosPorMes[i], moneda),
        saldo: formatMonto(acumulado, moneda),
      }
    })

    const totalIngresos = Math.round(ingresosPorMes.reduce((a, b) => a + b, 0) * 100) / 100
    const totalEgresos = Math.round(egresosPorMes.reduce((a, b) => a + b, 0) * 100) / 100

    const porTipo = new Map<string, { cantidad: number; monto: number }>()
    for (const a of aportes) {
      const tipo = a.tipo
      if (!porTipo.has(tipo)) porTipo.set(tipo, { cantidad: 0, monto: 0 })
      const g = porTipo.get(tipo)!
      g.cantidad += 1
      g.monto += Number(a.monto)
    }

    const orden = ['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA']
    const conceptos: ResumenFondoConcepto[] = orden
      .filter((t) => porTipo.has(t))
      .map((t) => {
        const g = porTipo.get(t)!
        return {
          concepto: conceptoLabel[t] || t,
          cantidad: g.cantidad,
          monto: formatMonto(g.monto, moneda),
        }
      })

    const estadoFondo = (() => {
      switch (fondo.estado) {
        case 'ACTIVO': return 'Activo'
        case 'INACTIVO': return 'Inactivo'
        case 'CERRADO': return 'Cerrado'
        default: return fondo.estado
      }
    })()

    const data: ResumenFondoData = {
      organizacion: fondo.nombre,
      lema: fondo.organizacion?.trim() || 'Registro solidario de ahorro y crédito',
      fechaEmision: formatFecha(new Date()),
      nombreFondo: fondo.nombre.toUpperCase(),
      monedaLabel: moneda === 'USD' ? 'DÓLARES (USD)' : 'SOLES (PEN)',
      fechaCorte: formatFecha(new Date()),
      estadoFondo,
      capitalInicial: formatMonto(Number(fondo.capitalInicial), moneda),
      aportesFondo: formatMonto(aportesFondo, moneda),
      interesesGanados: formatMonto(interesesGanados, moneda),
      totalFondo: formatMonto(totalFondo, moneda),
      sociosActivos,
      prestamosActivos,
      capitalPrestado: formatMonto(capitalPrestado, moneda),
      capitalDisponible: formatMonto(Number(fondo.capitalDisponible), moneda),
      anoPeriodo: ano,
      movimientos,
      totalIngresos: formatMonto(totalIngresos, moneda),
      totalEgresos: formatMonto(totalEgresos, moneda),
      totalSaldo: formatMonto(totalIngresos - totalEgresos, moneda),
      conceptos,
      observaciones: fondo.descripcion?.trim() || '',
    }

    const html = buildResumenFondoHtml(data)
    return renderHtmlToPdf(html)
  },
}
