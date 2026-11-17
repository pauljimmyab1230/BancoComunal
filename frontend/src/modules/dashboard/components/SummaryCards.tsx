import {
  Users,
  Building2,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency, formatSaldosPorMoneda } from '@/lib/utils'
import type { DashboardData } from '../types'

export default function SummaryCards({
  resumen,
  cajasCount,
}: {
  resumen: DashboardData['resumen']
  cajasCount: number
}) {
  const cards = [
    {
      label: 'Socios Activos',
      value: resumen.sociosActivos,
      sub: `${resumen.totalSocios} total`,
      icon: Users,
      color: 'bg-secondary',
      lightColor: 'bg-secondary/10',
    },
    {
      label: 'Fondos Activos',
      value: resumen.totalFondos,
      sub: `${resumen.fondosActivos} activos`,
      icon: Building2,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-500/10',
    },
    {
      label: 'Saldo Total Cajas',
      value: formatSaldosPorMoneda(resumen.totalSaldoCajasPorMoneda),
      sub: `${cajasCount} cajas`,
      icon: Wallet,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-500/10',
    },
    {
      label: 'Cartera Activa',
      value: formatCurrency(resumen.saldoPendienteCartera),
      sub: `${resumen.creditosActivos} préstamos`,
      icon: DollarSign,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-500/10',
    },
    {
      label: 'Aportes del Mes',
      value: formatCurrency(resumen.aportesMes),
      sub: `${resumen.cantidadAportesMes} aportes`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-500/10',
    },
    {
      label: 'Cuotas Vencidas',
      value: resumen.cuotasVencidas,
      sub: `${resumen.tasaMorosidad.toFixed(1)}% morosidad`,
      icon: AlertTriangle,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-500/10',
    },
    {
      label: 'Capital Recuperado',
      value: formatCurrency(resumen.capitalRecuperado),
      sub: `de ${formatCurrency(resumen.capitalPrestado)}`,
      icon: TrendingDown,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-600/10',
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <Card key={i} padding="md">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm text-muted">{c.label}</p>
              <p className="truncate text-2xl font-bold text-foreground">{c.value}</p>
              <p className="mt-1 text-xs text-subtle">{c.sub}</p>
            </div>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.lightColor}`}
            >
              <c.icon className={`h-6 w-6 ${c.color.replace('bg-', 'text-')}`} aria-hidden="true" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
