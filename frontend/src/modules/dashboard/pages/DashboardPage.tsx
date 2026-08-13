import { Users, Building2, DollarSign, Wallet, TrendingUp, TrendingDown, AlertTriangle, Clock, Activity, ArrowRight, Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { Card, Badge, LoadingSpinner, EmptyState, Button } from '@/components/ui'
import { formatCurrency, formatSaldosPorMoneda, exportCsv } from '@/lib/utils'
import type { DashboardData } from '../types'

const operacionIcon: Record<string, typeof Plus> = { CREATE: Plus, UPDATE: Pencil, DELETE: Trash2 }
const operacionColor: Record<string, string> = { CREATE: 'text-green-600', UPDATE: 'text-blue-600', DELETE: 'text-red-600' }
const operacionLabel: Record<string, string> = { CREATE: 'Creó', UPDATE: 'Actualizó', DELETE: 'Eliminó' }
const tablaLabel: Record<string, string> = {
  Socio: 'un socio', FondoRotatorio: 'un fondo', Aporte: 'un aporte',
  Prestamo: 'un préstamo', Caja: 'una caja',
  MovimientoCaja: 'un movimiento de caja', ConceptoCaja: 'un concepto', Usuario: 'un usuario',
  ArqueoCaja: 'un arqueo', CuotaPrestamo: 'una cuota',
}

function SummaryCards({ resumen, cajasCount }: { resumen: DashboardData['resumen']; cajasCount: number }) {
  const cards = [
    { label: 'Socios Activos', value: resumen.sociosActivos, sub: `${resumen.totalSocios} total`, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Fondos Activos', value: resumen.totalFondos, sub: `${resumen.fondosActivos} activos`, icon: Building2, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { label: 'Saldo Total Cajas', value: formatSaldosPorMoneda(resumen.totalSaldoCajasPorMoneda), sub: `${cajasCount} cajas`, icon: Wallet, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { label: 'Cartera Activa', value: formatCurrency(resumen.saldoPendienteCartera), sub: `${resumen.creditosActivos} préstamos`, icon: DollarSign, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
    { label: 'Aportes del Mes', value: formatCurrency(resumen.aportesMes), sub: `${resumen.cantidadAportesMes} aportes`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Cuotas Vencidas', value: resumen.cuotasVencidas, sub: `${resumen.tasaMorosidad.toFixed(1)}% morosidad`, icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
    { label: 'Capital Recuperado', value: formatCurrency(resumen.capitalRecuperado), sub: `de ${formatCurrency(resumen.capitalPrestado)}`, icon: TrendingDown, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => (
        <Card key={i} className={`p-4 border ${c.border} hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{c.label}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{c.value}</p>
              <p className="text-xs text-gray-400 truncate">{c.sub}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function CajasBar({ cajas }: { cajas: DashboardData['cajas'] }) {
  if (!cajas.length) return null
  const maxSaldo = Math.max(...cajas.map(c => Number(c.saldoActual)))

  return (
    <Card className="mb-6">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Wallet className="h-4 w-4" /> Estado de Cajas</h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => exportCsv('cajas-dashboard.csv', ['Código', 'Nombre', 'Moneda', 'Saldo'], cajas.map(c => [c.codigo, c.nombre, c.moneda || 'PEN', c.saldoActual]))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <span className="text-xs text-gray-400">{cajas.length} cajas activas</span>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {cajas.map((c) => {
          const pct = maxSaldo > 0 ? (Number(c.saldoActual) / maxSaldo) * 100 : 0
          return (
            <div key={c.id} className="flex items-center gap-4">
              <div className="w-28 shrink-0">
                <p className="text-sm font-medium text-gray-700 truncate">{c.nombre}</p>
                <p className="text-xs text-gray-400">{c.codigo} · {c.moneda}</p>
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%` }} />
              </div>
              <div className="w-28 text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(c.saldoActual))}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function CuotasProximas({ cuotas }: { cuotas: DashboardData['cuotasProximas'] }) {
  if (!cuotas.length) return null

  return (
    <Card className="mb-6">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Clock className="h-4 w-4" /> Próximos Vencimientos (14 días)</h3>
        <Badge variant="yellow">{cuotas.length} cuotas</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Socio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto Cuota</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Pendiente</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Vencimiento</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cuotas.slice(0, 8).map((c, i) => {
              const daysLeft = Math.ceil((new Date(c.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{c.socio}</td>
                  <td className="px-5 py-3 text-gray-500">{c.fondo}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(c.monto)}</td>
                  <td className="px-5 py-3 text-right text-red-600 font-medium">{formatCurrency(c.saldoPendiente)}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'yellow' : 'blue'}>
                      {daysLeft}d
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{c.telefono || '—'}</td>
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
    <Card className="mb-6">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Préstamos con Mayor Saldo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Socio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Pagado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Pendiente</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Progreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prestamos.map((p) => {
              const pct = p.monto > 0 ? Math.round((p.totalPagado / p.monto) * 100) : 0
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{p.socio.nombres} {p.socio.apellidoPaterno}</div>
                    <div className="text-xs text-gray-400">{p.socio.codigo}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.fondo.nombre}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(p.monto)}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(p.totalPagado)}</td>
                  <td className="px-5 py-3 text-right text-red-600 font-medium">{formatCurrency(p.saldoPendiente)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ActividadReciente({ actividad }: { actividad: DashboardData['actividadReciente'] }) {
  if (!actividad.length) return null

  return (
    <Card>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Activity className="h-4 w-4" /> Actividad Reciente</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {actividad.map((a) => {
          const Icon = operacionIcon[a.operacion] || Activity
          const color = operacionColor[a.operacion] || 'text-gray-600'
          const label = operacionLabel[a.operacion] || a.operacion
          const modulo = tablaLabel[a.tabla] || a.tabla
          const timeAgo = getTimeAgo(a.createdAt)
          return (
            <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{label} {modulo}</span>
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
    <Card className="mb-6 border-amber-200">
      <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Arqueos Pendientes de Aprobación</h3>
        <Badge variant="yellow">{arqueos.length}</Badge>
      </div>
      <div className="divide-y divide-gray-50">
        {arqueos.map((a) => (
          <div key={a.id} className="px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">{a.caja.nombre} — {a.codigo}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${a.diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                Dif: {formatCurrency(a.diferencia)}
              </p>
              <p className="text-xs text-gray-400">{new Date(a.fechaArqueo).toLocaleDateString('es-PE')}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MovimientosHoy({ movimientos }: { movimientos: DashboardData['movimientosHoy'] }) {
  if (!movimientos.length) return null

  return (
    <Card className="mb-6">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ArrowRight className="h-4 w-4" /> Movimientos de Hoy
        </h3>
        <Badge variant="default">{movimientos.length} movs</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Hora</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Concepto</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Tipo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movimientos.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-xs text-gray-500">{new Date(m.fechaMovimiento).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-5 py-3 text-sm text-gray-700">{m.caja.nombre}</td>
                <td className="px-5 py-3 text-sm text-gray-700">{m.concepto.nombre}</td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge>
                </td>
                <td className={`px-5 py-3 text-right font-medium ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(m.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner text="Cargando dashboard..." /></div>
  if (error) return <EmptyState title="Error al cargar" description="No se pudo cargar el resumen del dashboard." />
  if (!data) return <EmptyState title="Sin datos" />

  const d = data as DashboardData

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen general del sistema financiero</p>
      </div>

      <SummaryCards resumen={d.resumen} cajasCount={d.cajas?.length || 0} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CajasBar cajas={d.cajas} />
        <MovimientosHoy movimientos={d.movimientosHoy} />
      </div>

      <ArqueosAlerta arqueos={d.arqueosPendientes} />

      <CuotasProximas cuotas={d.cuotasProximas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrestamosTop5 prestamos={d.prestamosTop5} />
        <ActividadReciente actividad={d.actividadReciente} />
      </div>
    </div>
  )
}
