import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { DashboardData } from '../types'
import VerTodosLink from './VerTodosLink'

export default function CuotasProximas({ cuotas }: { cuotas: DashboardData['cuotasProximas'] }) {
  const [ahora] = useState(() => Date.now())

  if (!cuotas.length) return null

  return (
    <Card padding="md" className="mb-8">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Próximos Vencimientos</h3>
              <p className="text-xs text-muted">Próximos 14 días</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="yellow">{cuotas.length} cuotas</Badge>
            <VerTodosLink to="/creditos" label="Ver créditos" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Socio
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Fondo
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Monto
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Pendiente
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted">
                Vence
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {cuotas.slice(0, 6).map((c, i) => {
              const daysLeft = Math.ceil(
                (new Date(c.fechaVencimiento).getTime() - ahora) / (1000 * 60 * 60 * 24)
              )
              return (
                <tr key={i} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-4 font-medium text-foreground">{c.socio}</td>
                  <td className="px-5 py-4 text-muted">{c.fondo}</td>
                  <td className="px-5 py-4 text-right text-foreground">
                    {formatCurrency(c.monto)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(c.saldoPendiente)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'yellow' : 'blue'}>
                      {daysLeft}d
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-subtle">{c.telefono || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
