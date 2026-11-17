import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { DashboardData } from '../types'
import VerTodosLink from './VerTodosLink'

export default function MovimientosHoy({
  movimientos,
}: {
  movimientos: DashboardData['movimientosHoy']
}) {
  if (!movimientos.length) return null

  return (
    <Card padding="md">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <ArrowRight className="h-5 w-5 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Movimientos de Hoy</h3>
              <p className="text-xs text-muted">{movimientos.length} transacciones</p>
            </div>
          </div>
          <VerTodosLink to="/caja" label="Ver caja" />
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {movimientos.slice(0, 5).map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  m.tipo === 'INGRESO'
                    ? 'bg-emerald-100 dark:bg-emerald-500/15'
                    : 'bg-rose-100 dark:bg-rose-500/15'
                }`}
              >
                <ArrowRight
                  className={`h-4 w-4 ${
                    m.tipo === 'INGRESO'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'rotate-180 text-rose-600 dark:text-rose-400'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{m.concepto.nombre}</p>
                <p className="text-xs text-subtle">
                  {m.caja.nombre} ·{' '}
                  {new Date(m.fechaMovimiento).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                m.tipo === 'INGRESO'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {m.tipo === 'INGRESO' ? '+' : '-'}
              {formatCurrency(m.monto)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
