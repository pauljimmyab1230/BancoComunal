import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { DashboardData } from '../types'
import GraficoDona from './graficos/GraficoDona'
import GraficoBarras from './graficos/GraficoBarras'
import GraficoIndicador from './graficos/GraficoIndicador'

const ETIQUETA_TIPO_APORTE: Record<string, string> = {
  OBLIGATORIO: 'Obligatorio',
  EXTRAORDINARIO: 'Extraordinario',
  VOLUNTARIO: 'Voluntario',
  MULTA: 'Multa',
}

const ETIQUETA_MONEDA: Record<string, string> = {
  PEN: 'Soles (PEN)',
  USD: 'Dólares (USD)',
}

const ETIQUETA_TIPO_CAJA: Record<string, string> = {
  PRINCIPAL: 'Principal',
  SECUNDARIA: 'Secundaria',
  CAJA_CHICA: 'Caja Chica',
}

function mapearEtiquetado(registro: Record<string, number>, etiquetas: Record<string, string>) {
  const claves = Object.keys(registro)
  return {
    etiquetas: claves.map((clave) => etiquetas[clave] ?? clave),
    valores: claves.map((clave) => Number(registro[clave] ?? 0)),
  }
}

function agruparCajasPorTipo(cajas: DashboardData['cajas']) {
  const mapa: Record<string, number> = {}
  for (const caja of cajas) {
    const clave = ETIQUETA_TIPO_CAJA[caja.tipo] ?? caja.tipo ?? 'Otro'
    mapa[clave] = (mapa[clave] ?? 0) + Number(caja.saldoActual)
  }
  return { etiquetas: Object.keys(mapa), valores: Object.values(mapa).map((v) => Number(v ?? 0)) }
}

export default function GraficosResumen({ data }: { data: DashboardData }) {
  const aportes = mapearEtiquetado(data.resumen.aportesPorTipo || {}, ETIQUETA_TIPO_APORTE)
  const monedas = mapearEtiquetado(data.resumen.totalSaldoCajasPorMoneda || {}, ETIQUETA_MONEDA)

  const cajasConSaldo = (data.cajas || [])
    .filter((caja) => Number(caja.saldoActual) !== 0)
    .map((caja) => ({ nombre: caja.nombre, saldo: Number(caja.saldoActual) }))

  const cajasPorTipo = agruparCajasPorTipo(data.cajas || [])

  const sociosInactivos = Math.max(0, data.resumen.totalSocios - data.resumen.sociosActivos)

  const prestamosTop = (data.prestamosTop5 || [])
    .filter((p) => p.saldoPendiente > 0)
    .map((p) => ({
      nombre: `${p.socio?.nombres ?? ''} ${p.socio?.apellidoPaterno ?? ''}`.trim() || 'Socio',
      saldo: p.saldoPendiente,
    }))

  const cartera = [
    { label: 'Capital prestado', valor: data.resumen.capitalPrestado, color: '#6366f1' },
    { label: 'Capital recuperado', valor: data.resumen.capitalRecuperado, color: '#10b981' },
    { label: 'Saldo pendiente', valor: data.resumen.saldoPendienteCartera, color: '#f43f5e' },
  ]

  return (
    <section aria-label="Gráficos del dashboard" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {aportes.valores.some((v) => v > 0) && (
          <Card padding="md">
            <GraficoDona
              titulo="Aportes del mes por tipo"
              etiquetas={aportes.etiquetas}
              valores={aportes.valores}
              formato={formatCurrency}
            />
          </Card>
        )}
        {monedas.valores.length > 0 && (
          <Card padding="md">
            <GraficoDona
              titulo="Saldo en cajas por moneda"
              etiquetas={monedas.etiquetas}
              valores={monedas.valores}
              formato={formatCurrency}
            />
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {cajasConSaldo.length > 0 && (
          <Card padding="md">
            <GraficoBarras
              titulo="Saldo por caja"
              etiquetas={cajasConSaldo.map((caja) => caja.nombre)}
              valores={cajasConSaldo.map((caja) => caja.saldo)}
              formato={formatCurrency}
              horizontal
            />
          </Card>
        )}
        <Card padding="md">
          <GraficoBarras
            titulo="Cartera de créditos"
            etiquetas={cartera.map((item) => item.label)}
            valores={cartera.map((item) => item.valor)}
            colores={cartera.map((item) => item.color)}
            formato={formatCurrency}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.resumen.totalSocios > 0 && (
          <Card padding="md">
            <GraficoDona
              titulo="Socios por estado"
              etiquetas={['Activos', 'Inactivos']}
              valores={[data.resumen.sociosActivos, sociosInactivos]}
              formato={(v) => String(v)}
            />
          </Card>
        )}
        {cajasPorTipo.etiquetas.length > 0 && (
          <Card padding="md">
            <GraficoDona
              titulo="Saldo de cajas por tipo"
              etiquetas={cajasPorTipo.etiquetas}
              valores={cajasPorTipo.valores}
              formato={formatCurrency}
            />
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {prestamosTop.length > 0 && (
          <Card padding="md">
            <GraficoBarras
              titulo="Préstamos con mayor saldo"
              etiquetas={prestamosTop.map((p) => p.nombre)}
              valores={prestamosTop.map((p) => p.saldo)}
              formato={formatCurrency}
              horizontal
            />
          </Card>
        )}
        <Card padding="md">
          <div className="flex items-center justify-around">
            <GraficoIndicador
              titulo="Tasa de morosidad"
              valor={data.resumen.tasaMorosidad}
              maximo={100}
              color="#f43f5e"
              formato={(v) => `${v.toFixed(1)}%`}
            />
            <GraficoIndicador
              titulo="Cuotas vencidas"
              valor={data.resumen.cuotasVencidas}
              maximo={Math.max(1, data.resumen.cuotasVencidas)}
              color="#f59e0b"
              formato={(v) => String(v)}
            />
          </div>
        </Card>
      </div>
    </section>
  )
}
