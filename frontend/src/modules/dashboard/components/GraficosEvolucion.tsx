import { useState } from 'react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { useEvolucionDashboard } from '../hooks/useDashboard'
import GraficoLinea from './graficos/GraficoLinea'
import GraficoBarras from './graficos/GraficoBarras'

const OPCIONES_MESES = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 24, label: '24 meses' },
]

export default function GraficosEvolucion() {
  const [meses, setMeses] = useState(12)
  const { data, isLoading, isError } = useEvolucionDashboard(meses)

  if (isError) return null
  if (isLoading) {
    return (
      <Card padding="md">
        <p className="py-8 text-center text-sm text-muted">Cargando gráficos de evolución…</p>
      </Card>
    )
  }
  if (!data) return null

  const hayDatos =
    data.ingresosEgresos.some((x) => x.ingresos || x.egresos) ||
    data.aportes.some((x) => x.cantidad > 0) ||
    data.desembolsos.some((x) => x.cantidad > 0) ||
    data.altasSocios.some((x) => x.cantidad > 0) ||
    data.morosidadPorFondo.length > 0

  const etiquetasMeses = data.ingresosEgresos.map((x) => x.etiqueta)

  const neto = data.ingresosEgresos.map((x) => x.neto)
  const coloresNeto = neto.map((valor) => (valor >= 0 ? '#10b981' : '#f43f5e'))

  return (
    <section aria-label="Evolución histórica" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Evolución histórica</h2>
        <div
          role="group"
          aria-label="Rango de meses"
          className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1"
        >
          {OPCIONES_MESES.map((opcion) => {
            const activa = meses === opcion.value
            return (
              <button
                key={opcion.value}
                type="button"
                onClick={() => setMeses(opcion.value)}
                aria-pressed={activa}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activa
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                {opcion.label}
              </button>
            )
          })}
        </div>
      </div>

      {!hayDatos && (
        <Card padding="md">
          <p className="py-8 text-center text-sm text-muted">
            No hay movimientos históricos en el período seleccionado.
          </p>
        </Card>
      )}

      {hayDatos && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card padding="md">
              <GraficoLinea
                titulo="Ingresos vs egresos por mes"
                etiquetas={etiquetasMeses}
                series={[
                  {
                    nombre: 'Ingresos',
                    valores: data.ingresosEgresos.map((x) => x.ingresos),
                    color: '#10b981',
                    relleno: true,
                  },
                  {
                    nombre: 'Egresos',
                    valores: data.ingresosEgresos.map((x) => x.egresos),
                    color: '#f43f5e',
                    relleno: true,
                  },
                ]}
                formato={formatCurrency}
              />
            </Card>
            <Card padding="md">
              <GraficoBarras
                titulo="Flujo de caja neto por mes"
                etiquetas={etiquetasMeses}
                valores={neto}
                colores={coloresNeto}
                formato={formatCurrency}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card padding="md">
              <GraficoBarras
                titulo="Aportes por mes"
                etiquetas={data.aportes.map((x) => x.etiqueta)}
                valores={data.aportes.map((x) => x.monto)}
                formato={formatCurrency}
              />
            </Card>
            <Card padding="md">
              <GraficoBarras
                titulo="Desembolsos de créditos por mes"
                etiquetas={data.desembolsos.map((x) => x.etiqueta)}
                valores={data.desembolsos.map((x) => x.monto)}
                formato={formatCurrency}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card padding="md">
              <GraficoBarras
                titulo="Altas de socios por mes"
                etiquetas={data.altasSocios.map((x) => x.etiqueta)}
                valores={data.altasSocios.map((x) => x.cantidad)}
                formato={(v) => String(v)}
              />
            </Card>
            {data.morosidadPorFondo.length > 0 && (
              <Card padding="md">
                <GraficoBarras
                  titulo="Morosidad por fondo (monto adeudado)"
                  etiquetas={data.morosidadPorFondo.map((x) => x.fondo)}
                  valores={data.morosidadPorFondo.map((x) => x.montoAdeudado)}
                  formato={formatCurrency}
                  horizontal
                />
              </Card>
            )}
          </div>
        </>
      )}
    </section>
  )
}
