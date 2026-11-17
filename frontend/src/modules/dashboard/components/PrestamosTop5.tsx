import { DollarSign } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { DashboardData } from '../types'
import VerTodosLink from './VerTodosLink'

export default function PrestamosTop5({
  prestamos,
}: {
  prestamos: DashboardData['prestamosTop5']
}) {
  if (!prestamos.length) return null

  return (
    <Card padding="md">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <DollarSign
                className="h-5 w-5 text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Préstamos con Mayor Saldo</h3>
              <p className="text-xs text-muted">Top 5 pendientes</p>
            </div>
          </div>
          <VerTodosLink to="/creditos" label="Ver créditos" />
        </div>
      </div>
      <div className="p-4">
        {prestamos.map((p) => {
          const pct = p.monto > 0 ? Math.round((p.totalPagado / p.monto) * 100) : 0
          return (
            <div key={p.id} className="border-b border-border-subtle py-3 last:border-0">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.socio.nombres} {p.socio.apellidoPaterno}
                  </p>
                  <p className="text-xs text-subtle">{p.fondo.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(p.saldoPendiente)}
                  </p>
                  <p className="text-xs text-subtle">de {formatCurrency(p.monto)}</p>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
