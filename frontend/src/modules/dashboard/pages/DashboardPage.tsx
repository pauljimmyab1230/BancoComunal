import { useState } from 'react'
import {
  Users,
  Building2,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Activity,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Download,
} from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { Card, Badge, LoadingSpinner, EmptyState, Button, SectionHeader } from '@/components/ui'
import { formatCurrency, formatSaldosPorMoneda, exportCsv } from '@/lib/utils'
import type { DashboardData } from '../types'

const operacionIcon: Record<string, typeof Plus> = { CREATE: Plus, UPDATE: Pencil, DELETE: Trash2 }
const operacionColor: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-600',
  UPDATE: 'bg-blue-100 text-blue-600',
  DELETE: 'bg-red-100 text-red-600',
}
const operacionLabel: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
}
const tablaLabel: Record<string, string> = {
  Socio: 'un socio',
  FondoRotatorio: 'un fondo',
  Aporte: 'un aporte',
  Prestamo: 'un préstamo',
  Caja: 'una caja',
  MovimientoCaja: 'un movimiento de caja',
  ConceptoCaja: 'un concepto',
  Usuario: 'un usuario',
  ArqueoCaja: 'un arqueo',
  CuotaPrestamo: 'una cuota',
}

function SummaryCards({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c, i) => (
        <Card key={i} padding="md">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 truncate">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </div>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.lightColor}`}
            >
              <c.icon className={`h-6 w-6 ${c.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function CajasBar({ cajas }: { cajas: DashboardData['cajas'] }) {
  if (!cajas.length) return null
  const maxSaldo = Math.max(...cajas.map((c) => Number(c.saldoActual)))

  return (
    <Card padding="md">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Estado de Cajas</h3>
              <p className="text-xs text-gray-500">{cajas.length} cajas activas</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              exportCsv(
                'cajas-dashboard.csv',
                ['Código', 'Nombre', 'Moneda', 'Saldo'],
                cajas.map((c) => [c.codigo, c.nombre, c.moneda || 'PEN', c.saldoActual])
              )
            }
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {cajas.map((c) => {
          const pct = maxSaldo > 0 ? (Number(c.saldoActual) / maxSaldo) * 100 : 0
          return (
            <div key={c.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
                  <span className="text-xs text-gray-400">({c.codigo})</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(Number(c.saldoActual))}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 group-hover:bg-emerald-600"
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

function MovimientosHoy({ movimientos }: { movimientos: DashboardData['movimientosHoy'] }) {
  if (!movimientos.length) return null

  return (
    <Card padding="md">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <ArrowRight className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Movimientos de Hoy</h3>
              <p className="text-xs text-gray-500">{movimientos.length} transacciones</p>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {movimientos.slice(0, 5).map((m) => (
          <div
            key={m.id}
            className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.tipo === 'INGRESO' ? 'bg-emerald-100' : 'bg-rose-100'}`}
              >
                <ArrowRight
                  className={`h-4 w-4 ${m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600 rotate-180'}`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{m.concepto.nombre}</p>
                <p className="text-xs text-gray-400">
                  {m.caja.nombre} ·{' '}
                  {new Date(m.fechaMovimiento).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}
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

function CuotasProximas({ cuotas }: { cuotas: DashboardData['cuotasProximas'] }) {
  const [ahora] = useState(() => Date.now())

  if (!cuotas.length) return null

  return (
    <Card padding="md" className="mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Próximos Vencimientos</h3>
              <p className="text-xs text-gray-500">Próximos 14 días</p>
            </div>
          </div>
          <Badge variant="yellow">{cuotas.length} cuotas</Badge>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Socio
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Fondo
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Monto
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pendiente
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                Vence
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cuotas.slice(0, 6).map((c, i) => {
              const daysLeft = Math.ceil(
                (new Date(c.fechaVencimiento).getTime() - ahora) / (1000 * 60 * 60 * 24)
              )
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{c.socio}</td>
                  <td className="px-5 py-4 text-gray-500">{c.fondo}</td>
                  <td className="px-5 py-4 text-right text-gray-700">{formatCurrency(c.monto)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-rose-600">
                    {formatCurrency(c.saldoPendiente)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'yellow' : 'blue'}>
                      {daysLeft}d
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{c.telefono || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function PrestamosTop5({ prestamos }: { prestamos: DashboardData['prestamosTop5'] }) {
  if (!prestamos.length) return null

  return (
    <Card padding="md">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <DollarSign className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Préstamos con Mayor Saldo</h3>
            <p className="text-xs text-gray-500">Top 5 pendientes</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {prestamos.map((p) => {
          const pct = p.monto > 0 ? Math.round((p.totalPagado / p.monto) * 100) : 0
          return (
            <div key={p.id} className="py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.socio.nombres} {p.socio.apellidoPaterno}
                  </p>
                  <p className="text-xs text-gray-400">{p.fondo.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(p.saldoPendiente)}
                  </p>
                  <p className="text-xs text-gray-400">de {formatCurrency(p.monto)}</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ActividadReciente({ actividad }: { actividad: DashboardData['actividadReciente'] }) {
  if (!actividad.length) return null

  return (
    <Card padding="md">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Activity className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Actividad Reciente</h3>
            <p className="text-xs text-gray-500">Últimas operaciones</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {actividad.slice(0, 5).map((a) => {
          const Icon = operacionIcon[a.operacion] || Activity
          const color = operacionColor[a.operacion] || 'bg-gray-100 text-gray-600'
          const label = operacionLabel[a.operacion] || a.operacion
          const modulo = tablaLabel[a.tabla] || a.tabla
          const timeAgo = getTimeAgo(a.createdAt)
          return (
            <div
              key={a.id}
              className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    {label} {modulo}
                  </span>
                </p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ArqueosAlerta({ arqueos }: { arqueos: DashboardData['arqueosPendientes'] }) {
  if (!arqueos.length) return null

  return (
    <Card padding="md" className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="px-6 py-4 border-b border-amber-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Arqueos Pendientes</h3>
              <p className="text-xs text-amber-600">{arqueos.length} por aprobar</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        {arqueos.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-800">{a.caja.nombre}</span>
              <span className="text-xs text-amber-500">({a.codigo})</span>
            </div>
            <span
              className={`text-sm font-semibold ${a.diferencia === 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              Dif: {formatCurrency(a.diferencia)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner text="Cargando dashboard..." />
      </div>
    )
  if (error)
    return (
      <EmptyState
        title="Error al cargar"
        description="No se pudo cargar el resumen del dashboard."
      />
    )
  if (!data) return <EmptyState title="Sin datos" />

  const d = data as DashboardData

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" description="Resumen general del sistema" />

      <SummaryCards resumen={d.resumen} cajasCount={d.cajas?.length || 0} />

      <ArqueosAlerta arqueos={d.arqueosPendientes} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CajasBar cajas={d.cajas} />
        <MovimientosHoy movimientos={d.movimientosHoy} />
      </div>

      <CuotasProximas cuotas={d.cuotasProximas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrestamosTop5 prestamos={d.prestamosTop5} />
        <ActividadReciente actividad={d.actividadReciente} />
      </div>
    </div>
  )
}
