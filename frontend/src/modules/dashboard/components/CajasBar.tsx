import { Wallet, Download } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { formatCurrency, exportCsv, exportXlsx } from '@/lib/utils'
import type { DashboardData } from '../types'
import VerTodosLink from './VerTodosLink'

export default function CajasBar({ cajas }: { cajas: DashboardData['cajas'] }) {
  if (!cajas.length) return null
  const maxSaldo = Math.max(...cajas.map((c) => Number(c.saldoActual)))

  const exportar = (formato: 'csv' | 'xlsx') => {
    const headers = ['Código', 'Nombre', 'Moneda', 'Saldo']
    const filas = cajas.map((c) => [c.codigo, c.nombre, c.moneda || 'PEN', c.saldoActual])
    if (formato === 'csv') exportCsv('cajas-dashboard.csv', headers, filas)
    else exportXlsx('cajas-dashboard.xlsx', headers, filas)
  }

  return (
    <Card padding="md">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Wallet
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Estado de Cajas</h3>
              <p className="text-xs text-muted">{cajas.length} cajas activas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => exportar('csv')}>
              <Download className="mr-1 h-4 w-4" aria-hidden="true" /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportar('xlsx')}>
              <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Excel
            </Button>
            <VerTodosLink to="/caja" label="Ver cajas" />
          </div>
        </div>
      </div>
      <div className="space-y-4 p-6">
        {cajas.map((c) => {
          const pct = maxSaldo > 0 ? (Number(c.saldoActual) / maxSaldo) * 100 : 0
          return (
            <div key={c.id} className="group">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.nombre}</span>
                  <span className="text-xs text-subtle">({c.codigo})</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(Number(c.saldoActual))}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500 group-hover:bg-emerald-600"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
