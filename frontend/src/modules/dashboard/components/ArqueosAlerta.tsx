import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { DashboardData } from '../types'
import VerTodosLink from './VerTodosLink'

export default function ArqueosAlerta({
  arqueos,
}: {
  arqueos: DashboardData['arqueosPendientes']
}) {
  if (!arqueos.length) return null

  return (
    <Card
      padding="md"
      className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10"
    >
      <div className="border-b border-amber-200/50 px-6 py-4 dark:border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
              <AlertTriangle
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Arqueos Pendientes
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {arqueos.length} por aprobar
              </p>
            </div>
          </div>
          <VerTodosLink to="/caja" label="Ver cajas" />
        </div>
      </div>
      <div className="p-4">
        {arqueos.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-800 dark:text-amber-200">{a.caja.nombre}</span>
              <span className="text-xs text-amber-500">({a.codigo})</span>
            </div>
            <span
              className={`text-sm font-semibold ${
                a.diferencia === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Dif: {formatCurrency(a.diferencia)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
