import { useState, type JSX } from 'react'
import {
  Search,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Wallet,
  Printer,
  Download,
  ArrowDownCircle,
  Scale,
  Clock,
  BookOpen,
  WalletCards,
  ArrowLeft,
} from 'lucide-react'
import {
  useResumenEjecutivo,
  useCarteraCreditos,
  useEstadoResultados,
  useReporteAportes,
  useMorosos,
  useEstadoCuentasSocio,
  useFlujoCaja,
  useBalanceGeneral,
  useAntiguedadCartera,
  useLibroDiario,
  useReporteArqueos,
  useMovimientosCaja,
} from '../hooks/useReportes'
import { useCajas } from '@/modules/caja/hooks/useCajas'
import { usePaginacionCliente } from '@/hooks/usePaginacionCliente'
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SectionHeader,
  Badge,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  Pagination,
} from '@/components/ui'
import { formatCurrency, formatSaldosPorMoneda, exportCsv, exportXlsx } from '@/lib/utils'
import { useFondos } from '@/modules/fondos/hooks/useFondos'
import type {
  ResumenEjecutivo,
  CarteraCreditoPrestamo,
  EstadoResultadosFondo,
  ReporteAporte,
  Moroso,
  CarteraCreditosQuery,
  ReporteAportesQuery,
} from '../types'
import type { Caja } from '@/modules/caja/types'

const reportCards = [
  {
    id: 'balance',
    label: 'Balance General',
    desc: 'Activos y patrimonio',
    icon: Scale,
    color: 'blue',
  },
  {
    id: 'resultados',
    label: 'Estado de Resultados',
    desc: 'Ingresos vs egresos',
    icon: TrendingUp,
    color: 'green',
  },
  {
    id: 'flujo',
    label: 'Flujo de Caja',
    desc: 'Movimientos de entrada y salida',
    icon: ArrowDownCircle,
    color: 'green',
  },
  {
    id: 'cartera',
    label: 'Cartera de Créditos',
    desc: 'Préstamos activos y saldos',
    icon: DollarSign,
    color: 'purple',
  },
  {
    id: 'aging',
    label: 'Antigüedad de Cartera',
    desc: 'Saldos por días de atraso',
    icon: Clock,
    color: 'purple',
  },
  {
    id: 'morosos',
    label: 'Morosos',
    desc: 'Socios con cuotas vencidas',
    icon: AlertTriangle,
    color: 'red',
  },
  {
    id: 'movimientos',
    label: 'Movimientos de Caja',
    desc: 'Detalle de transacciones',
    icon: WalletCards,
    color: 'green',
  },
  {
    id: 'libro',
    label: 'Libro Diario',
    desc: 'Log cronológico de asientos',
    icon: BookOpen,
    color: 'blue',
  },
  {
    id: 'cuenta',
    label: 'Estado de Cuentas',
    desc: 'Consulta por socio',
    icon: Users,
    color: 'orange',
  },
]

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-500/15',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-300 dark:hover:border-blue-500/40',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-500/15',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-300 dark:hover:border-purple-500/40',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-500/15',
    icon: 'text-green-600 dark:text-green-400',
    border: 'hover:border-green-300 dark:hover:border-green-500/40',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-500/15',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'hover:border-orange-300 dark:hover:border-orange-500/40',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-500/15',
    icon: 'text-red-600 dark:text-red-400',
    border: 'hover:border-red-300 dark:hover:border-red-500/40',
  },
}

export function ResumenTab() {
  const { data, isLoading, isError, error, refetch } = useResumenEjecutivo()

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando resumen..." />
      </div>
    )
  if (!data)
    return <EmptyState title="Sin datos" description="No se pudo cargar el resumen ejecutivo." />

  const r = data as ResumenEjecutivo

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Socios Activos</p>
              <p className="text-2xl font-bold text-foreground">
                {r.socios.activos} <span className="text-xs text-subtle">/ {r.socios.total}</span>
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/15">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Saldo Total Cajas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatSaldosPorMoneda(r.totalSaldoCajasPorMoneda)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Cartera Activa</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(r.creditos.saldoPendiente)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Cuotas Vencidas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {r.creditos.cuotasVencidas}{' '}
                <span className="text-xs text-subtle">
                  ({r.creditos.tasaMorosidad.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Créditos</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted">Préstamos activos</span>
              <span className="text-sm font-medium">{r.creditos.activos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Capital prestado</span>
              <span className="text-sm font-medium">
                {formatCurrency(r.creditos.capitalPrestado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Capital recuperado</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(r.creditos.capitalRecuperado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Saldo pendiente</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(r.creditos.saldoPendiente)}
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Aportes</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted">Aportes del mes</span>
              <span className="text-sm font-medium">{formatCurrency(r.aportes.mesActual)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Cuotas por vencer (7 días)</span>
              <span className="text-sm font-medium">{r.cuotasPorVencer}</span>
            </div>
          </div>
        </Card>
      </div>

      {r.cajas.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Estado de Cajas</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  exportCsv(
                    'resumen-cajas.csv',
                    ['Código', 'Nombre', 'Moneda', 'Saldo'],
                    r.cajas.map((c) => [c.codigo, c.nombre, c.moneda || 'PEN', c.saldoActual])
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Código
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Nombre
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Moneda
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {r.cajas.map((c, i) => (
                  <tr key={i} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">{c.codigo}</td>
                    <td className="px-5 py-3">{c.nombre}</td>
                    <td className="px-5 py-3">
                      <Badge variant="gray">{c.moneda || 'PEN'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatCurrency(c.saldoActual, c.moneda || 'PEN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function CarteraTab() {
  const [estado, setEstado] = useState<CarteraCreditosQuery['estado']>('TODOS')
  const [fondoId, setFondoId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const { data: fondosData } = useFondos({ limit: 1000 })
  const { data, isLoading, isError, error, refetch } = useCarteraCreditos({
    estado,
    fondoId: fondoId ? Number(fondoId) : undefined,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  })

  const prestamos = data?.prestamos ?? []
  const {
    datosPagina: prestamosPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(prestamos, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando cartera..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const { resumen } = data
  const fondosOptions = (fondosData?.data || []).map((f: { id: number; nombre: string }) => ({
    value: String(f.id),
    label: f.nombre,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Préstamos Activos</p>
          <p className="text-2xl font-bold">{resumen.prestamosActivos}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Monto Total</p>
          <p className="text-2xl font-bold">{formatCurrency(resumen.montoTotal)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Saldo Pendiente</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(resumen.saldoTotal)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Tasa Morosidad</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {resumen.tasaMorosidad.toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Estado">
            <Select
              options={[
                { value: 'TODOS', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'PAGADO', label: 'Pagados' },
                { value: 'ANULADO', label: 'Anulados' },
              ]}
              value={estado}
              onChange={(e) => setEstado(e.target.value as CarteraCreditosQuery['estado'])}
            />
          </FormField>
          <FormField label="Fondo">
            <Select
              options={[{ value: '', label: 'Todos los fondos' }, ...fondosOptions]}
              value={fondoId}
              onChange={(e) => setFondoId(e.target.value)}
            />
          </FormField>
          <FormField label="Desde">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </FormField>
          <FormField label="Hasta">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(
                  'cartera-creditos.csv',
                  [
                    'Socio',
                    'Código',
                    'Fondo',
                    'Moneda',
                    'Monto',
                    'Pagado',
                    'Pendiente',
                    'Cuotas Pagadas',
                    'Cuotas Vencidas',
                    'Estado',
                  ],
                  prestamos.map((p) => [
                    p.socio.nombres + ' ' + p.socio.apellidoPaterno,
                    p.socio.codigo,
                    p.fondo.nombre,
                    p.moneda || '',
                    p.monto,
                    p.totalPagado,
                    p.saldoPendiente,
                    `${p.cuotasPagadas}/${p.numeroCuotas}`,
                    p.cuotasVencidas,
                    p.estado,
                  ])
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Socio
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fondo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Moneda
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Pagado
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Pendiente
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Cuotas
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {prestamosPagina.map((p: CarteraCreditoPrestamo) => (
                <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {p.socio.nombres} {p.socio.apellidoPaterno}
                    </div>
                    <div className="text-xs text-muted">{p.socio.codigo}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{p.fondo.nombre}</td>
                  <td className="px-5 py-3">
                    <Badge variant="gray">{p.moneda || 'PEN'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatCurrency(p.monto, p.moneda || 'PEN')}
                  </td>
                  <td className="px-5 py-3 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(p.totalPagado, p.moneda || 'PEN')}
                  </td>
                  <td className="px-5 py-3 text-right text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(p.saldoPendiente, p.moneda || 'PEN')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm">
                      {p.cuotasPagadas}/{p.numeroCuotas}
                    </span>
                    {p.cuotasVencidas > 0 && (
                      <span className="ml-1 text-xs text-red-500 dark:text-red-400">
                        ({p.cuotasVencidas} vencidas)
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge
                      variant={
                        p.estado === 'ACTIVO' ? 'green' : p.estado === 'PAGADO' ? 'blue' : 'gray'
                      }
                    >
                      {p.estado}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {prestamos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

function ResultadosTab() {
  const getDefaultDate = (): { inicio: string; fin: string } => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      inicio: first.toISOString().split('T')[0] ?? '',
      fin: now.toISOString().split('T')[0] ?? '',
    }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)

  const { data, isLoading, isError, error, refetch } = useEstadoResultados({
    fechaInicio,
    fechaFin,
  })

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando estado de resultados..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-end gap-4">
          <FormField label="Fecha Inicio">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha Fin">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportCsv(
                'estado-resultados.csv',
                [
                  'Fondo',
                  'Moneda',
                  'Ingresos - Cuotas',
                  'Ingresos - Intereses',
                  'Ingresos - Reintegros',
                  'Ingresos - Otros',
                  'Total Ingresos',
                  'Egresos - Gastos',
                  'Egresos - Faltantes',
                  'Total Egresos',
                  'Resultado Neto',
                ],
                data.fondos.map((f) => [
                  f.fondo.nombre,
                  f.fondo.moneda,
                  f.ingresos.cuotas,
                  f.ingresos.intereses,
                  f.ingresos.reintegros,
                  f.ingresos.otros,
                  f.ingresos.total,
                  f.egresos.gastos,
                  f.egresos.faltantes,
                  f.egresos.total,
                  f.resultadoNeto,
                ])
              )
            }
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.totales.ingresos)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Total Egresos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.totales.egresos)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Resultado Neto</p>
          <p
            className={`text-2xl font-bold ${data.totales.neto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {formatCurrency(data.totales.neto)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Ingresos por concepto</h3>
          </div>
          <div className="p-5 space-y-2 text-sm">
            {data.fondos
              .reduce(
                (rows, f) => {
                  const push = (label: string, value: number) => {
                    const existing = rows.find((r) => r[0] === label)
                    if (existing) existing[1] = (existing[1] as number) + value
                    else rows.push([label, value])
                  }
                  push('Cuotas cobradas', f.ingresos.cuotas)
                  push('Intereses', f.ingresos.intereses)
                  push('Reintegros', f.ingresos.reintegros)
                  push('Otros ingresos', f.ingresos.otros)
                  return rows
                },
                [] as [string, number][]
              )
              .map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Egresos por concepto</h3>
          </div>
          <div className="p-5 space-y-2 text-sm">
            {data.fondos
              .reduce(
                (rows, f) => {
                  const push = (label: string, value: number) => {
                    const existing = rows.find((r) => r[0] === label)
                    if (existing) existing[1] = (existing[1] as number) + value
                    else rows.push([label, value])
                  }
                  push('Gastos operativos', f.egresos.gastos)
                  push('Faltantes de arqueo', f.egresos.faltantes)
                  return rows
                },
                [] as [string, number][]
              )
              .map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fondo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Capital
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Ingresos
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Egresos
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Neto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.fondos.map((f: EstadoResultadosFondo) => (
                <tr key={f.fondo.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 font-medium">{f.fondo.nombre}</td>
                  <td className="px-5 py-3 text-right">
                    {formatCurrency(f.fondo.capitalDisponible)}
                  </td>
                  <td className="px-5 py-3 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(f.ingresos.total)}
                  </td>
                  <td className="px-5 py-3 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(f.egresos.total)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${f.resultadoNeto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {formatCurrency(f.resultadoNeto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function AportesTab() {
  const [tipo, setTipo] = useState<ReporteAportesQuery['tipo']>('TODOS')
  const { data, isLoading, isError, error, refetch } = useReporteAportes({ tipo })

  const aportes = data?.aportes ?? []
  const {
    datosPagina: aportesPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(aportes, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando aportes..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const { resumen } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Aportes</p>
          <p className="text-2xl font-bold">{resumen.totalAportes}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Monto Total</p>
          <p className="text-2xl font-bold">{formatCurrency(resumen.montoTotal)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Obligatorios</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(resumen.porTipo.obligatorio)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Extraordinarios</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(resumen.porTipo.extraordinario)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Voluntarios</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(resumen.porTipo.voluntario)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Multas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(resumen.porTipo.multa)}
          </p>
        </Card>
      </div>

      {Object.keys(resumen.porMetodo).length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Aportes por método de pago</h3>
          </div>
          <div className="p-5 flex flex-wrap gap-4 text-sm">
            {Object.entries(resumen.porMetodo).map(([metodo, monto]) => (
              <div key={metodo} className="flex flex-col">
                <span className="text-xs text-muted">{metodo}</span>
                <span className="font-semibold">{formatCurrency(monto)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="md">
        <div className="flex items-end gap-4">
          <FormField label="Tipo">
            <Select
              options={[
                { value: 'TODOS', label: 'Todos' },
                { value: 'OBLIGATORIO', label: 'Obligatorio' },
                { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
                { value: 'VOLUNTARIO', label: 'Voluntario' },
                { value: 'MULTA', label: 'Multa' },
              ]}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ReporteAportesQuery['tipo'])}
            />
          </FormField>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportCsv(
                'reporte-aportes.csv',
                ['Socio', 'Código', 'Fondo', 'Periodo', 'Tipo', 'Monto', 'Fecha', 'Método'],
                aportes.map((a) => [
                  a.socio.nombres + ' ' + a.socio.apellidoPaterno,
                  a.socio.codigo,
                  a.fondo.nombre,
                  a.periodo,
                  a.tipo,
                  a.monto,
                  a.fechaAporte,
                  a.metodoPago,
                ])
              )
            }
          >
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Socio
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fondo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Periodo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {aportesPagina.map((a: ReporteAporte) => (
                <tr key={a.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {a.socio.nombres} {a.socio.apellidoPaterno}
                    </div>
                    <div className="text-xs text-muted">{a.socio.codigo}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{a.fondo.nombre}</td>
                  <td className="px-5 py-3 text-sm font-mono">{a.periodo}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        a.tipo === 'OBLIGATORIO'
                          ? 'blue'
                          : a.tipo === 'EXTRAORDINARIO'
                            ? 'purple'
                            : a.tipo === 'MULTA'
                              ? 'red'
                              : 'green'
                      }
                    >
                      {a.tipo}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(a.monto)}</td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {new Date(a.fechaAporte).toLocaleDateString('es-PE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {aportes.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

function MorososTab() {
  const [diasMinimos, setDiasMinimos] = useState(1)
  const { data, isLoading, isError, error, refetch } = useMorosos({ diasMinimos })

  const morosos = data?.morosos ?? []
  const {
    datosPagina: morososPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(morosos, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando morosos..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const { resumen } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Morosos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {resumen.totalMorosos}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Monto Adeudado</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(resumen.montoTotalAdeudado)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Cuotas Vencidas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {resumen.cuotasVencidasTotal}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <FormField label="Días mínimos de atraso">
          <Input
            type="number"
            min="1"
            value={diasMinimos}
            onChange={(e) => setDiasMinimos(Number(e.target.value))}
            className="max-w-[120px]"
          />
        </FormField>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Socio
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fondo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Días Atraso
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Cuotas Vencidas
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto Adeudado
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {morososPagina.map((m: Moroso, i: number) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {m.socio.nombres} {m.socio.apellidoPaterno}
                    </div>
                    <div className="text-xs text-muted">
                      {m.socio.codigo} - {m.socio.dni}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{m.fondo.nombre}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge
                      variant={
                        m.diasMaxAtraso > 60 ? 'red' : m.diasMaxAtraso > 30 ? 'yellow' : 'blue'
                      }
                    >
                      {m.diasMaxAtraso} días
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-center font-medium">{m.cuotasAtrasadas}</td>
                  <td className="px-5 py-3 text-right font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(m.montoAdeudado)}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{m.socio.telefono || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {morosos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

function EstadoCuentaTab() {
  const [query, setQuery] = useState<{ socioId?: number; search?: string } | null>(null)
  const [socioSearch, setSocioSearch] = useState('')
  const { data, isLoading, isError, error, refetch } = useEstadoCuentasSocio(query)

  const handleSearch = () => {
    const value = socioSearch.trim()
    if (!value) return
    const id = Number(value)
    setQuery(id > 0 ? { socioId: id } : { search: value })
  }

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-end gap-4">
          <FormField label="ID, DNI o Código del Socio">
            <Input
              type="text"
              value={socioSearch}
              onChange={(e) => setSocioSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder="Ej: 5, 45876123 o SOC-003"
              className="max-w-[260px]"
            />
          </FormField>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" /> Buscar
          </Button>
        </div>
      </Card>

      {!query && (
        <EmptyState
          title="Busque un socio"
          description="Ingrese el ID, DNI o código del socio para ver su estado de cuentas."
        />
      )}

      {query && isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Cargando estado de cuentas..." />
        </div>
      )}

      {query && isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {query && !isLoading && !isError && !data && (
        <EmptyState
          title="Socio no encontrado"
          description="No se encontró un socio con ese ID, DNI o código."
        />
      )}

      {data && (
        <div className="space-y-6">
          <Card>
            <div className="px-5 py-3 border-b border-border-subtle bg-surface-muted/60">
              <h3 className="text-sm font-semibold text-foreground">
                {data.socio.codigo} - {data.socio.nombres} {data.socio.apellidoPaterno}{' '}
                {data.socio.apellidoMaterno}
              </h3>
              <p className="text-xs text-muted mt-1">
                DNI: {data.socio.dni} | Ingreso:{' '}
                {new Date(data.socio.fechaIngreso).toLocaleDateString('es-PE')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
              <div>
                <p className="text-xs text-muted">Total Aportes</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(data.resumen.totalAportes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Total Préstamos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.resumen.totalPrestamos)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Deuda Total</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(data.resumen.totalDeuda)}
                </p>
              </div>
            </div>
          </Card>

          {data.prestamos.length > 0 && (
            <Card>
              <div className="px-5 py-3 border-b border-border-subtle">
                <h3 className="text-sm font-semibold text-foreground">Préstamos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                        Fondo
                      </th>
                      <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                        Monto
                      </th>
                      <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                        Cuotas
                      </th>
                      <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.prestamos.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3">{p.fondo.nombre}</td>
                        <td className="px-5 py-3 text-right">{formatCurrency(p.monto)}</td>
                        <td className="px-5 py-3 text-center">
                          {p.cuotas.length}/{p.numeroCuotas}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={p.estado === 'ACTIVO' ? 'green' : 'gray'}>
                            {p.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function FlujoCajaTab() {
  const getDefaultDate = (): { inicio: string; fin: string } => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      inicio: first.toISOString().split('T')[0] ?? '',
      fin: now.toISOString().split('T')[0] ?? '',
    }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)
  const [cajaId, setCajaId] = useState('')
  const { data: cajasData } = useCajas({ limit: 100 })
  const { data, isLoading, isError, error, refetch } = useFlujoCaja({
    fechaInicio,
    fechaFin,
    cajaId: cajaId ? Number(cajaId) : undefined,
  })

  const movimientos = data?.movimientos ?? []
  const {
    datosPagina: movimientosPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(movimientos, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando flujo de caja..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const cajasOptions = (cajasData?.data || []).map((c: Caja) => ({
    value: String(c.id),
    label: c.nombre,
  }))

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Fecha Inicio">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha Fin">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <FormField label="Caja">
            <Select
              options={[{ value: '', label: 'Todas' }, ...cajasOptions]}
              value={cajaId}
              onChange={(e) => setCajaId(e.target.value)}
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(
                  'flujo-caja.csv',
                  ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método'],
                  data.movimientos.map((m) => [
                    m.fecha,
                    m.codigo,
                    m.concepto,
                    m.tipo,
                    m.monto,
                    m.caja,
                    m.metodoPago,
                  ])
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportXlsx(
                  'flujo-caja.xlsx',
                  ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método'],
                  data.movimientos.map((m) => [
                    m.fecha,
                    m.codigo,
                    m.concepto,
                    m.tipo,
                    m.monto,
                    m.caja,
                    m.metodoPago,
                  ])
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.resumen.totalIngresos)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Total Egresos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.resumen.totalEgresos)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Flujo Neto</p>
          <p
            className={`text-2xl font-bold ${data.resumen.flujoNeto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {formatCurrency(data.resumen.flujoNeto)}
          </p>
        </Card>
      </div>

      {data.porCaja.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Por Caja</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/60">
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Caja
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Ingresos
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Egresos
                  </th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.porCaja.map((c, i) => (
                  <tr key={i} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 font-medium">{c.caja}</td>
                    <td className="px-5 py-3 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(c.ingresos)}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 dark:text-red-400">
                      {formatCurrency(c.egresos)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-medium ${c.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {formatCurrency(c.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="px-5 py-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-foreground">Detalle de Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fecha
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Código
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Concepto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Caja
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {movimientosPagina.map((m) => (
                <tr key={m.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 text-sm">
                    {new Date(m.fecha).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{m.codigo}</td>
                  <td className="px-5 py-3">{m.concepto}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge>
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${m.tipo === 'INGRESO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {formatCurrency(m.monto)}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{m.caja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {data.movimientos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

function BalanceGeneralTab() {
  const { data, isLoading, isError, error, refetch } = useBalanceGeneral()
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando balance general..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const cuadra = data.activos.total === data.patrimonio.total

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Activos</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(data.activos.total)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Total Patrimonio</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.patrimonio.total)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Ecuación Contable</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={cuadra ? 'green' : 'red'}>{cuadra ? 'CUADRA' : 'NO CUADRA'}</Badge>
            <span className="text-xs text-muted">A = P</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">ACTIVOS</h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Cajas (Efectivo)</span>
              <span className="font-medium">{formatCurrency(data.activos.cajas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cartera de Créditos</span>
              <span className="font-medium">{formatCurrency(data.activos.cartera)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Total Activos</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.activos.total)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">PATRIMONIO</h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Capital Inicial</span>
              <span className="font-medium">{formatCurrency(data.patrimonio.capitalInicial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Aportes Acumulados</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(data.patrimonio.aportes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Interés Ganado</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(data.patrimonio.interesGanado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Gastos Operativos</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                ({formatCurrency(data.patrimonio.gastosOperativos)})
              </span>
            </div>
            {data.patrimonio.capitalPrestadoActivo > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Capital Prestado Activo</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  ({formatCurrency(data.patrimonio.capitalPrestadoActivo)})
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted">Resultado del Ejercicio</span>
              <span
                className={`font-medium ${data.patrimonio.resultadoEjercicio >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(data.patrimonio.resultadoEjercicio)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Total Patrimonio</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.patrimonio.total)}
              </span>
            </div>
          </div>
        </Card>
      </div>
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir
      </Button>
    </div>
  )
}

function AntiguedadCarteraTab() {
  const { data, isLoading, isError, error, refetch } = useAntiguedadCartera()
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando antigüedad de cartera..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  const rangoColors: Record<string, 'green' | 'blue' | 'yellow' | 'red'> = {
    '0-30': 'green',
    '31-60': 'blue',
    '61-90': 'yellow',
    '90+': 'red',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Cuotas Pendientes</p>
          <p className="text-2xl font-bold">{data.total.cantidad}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Monto Total Pendiente</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.total.monto)}
          </p>
        </Card>
      </div>
      <Card>
        <div className="px-5 py-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-foreground">Antigüedad por Rango de Días</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Rango de Días
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Cantidad Cuotas
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {data.rangos.map((r) => (
                <tr key={r.rango} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3">
                    <Badge variant={rangoColors[r.rango] || 'gray'}>{r.rango} días</Badge>
                  </td>
                  <td className="px-5 py-3 text-center font-medium">{r.cantidad}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(r.monto)}</td>
                  <td className="px-5 py-3 text-right text-sm text-muted">
                    {data.total.monto > 0 ? ((r.monto / data.total.monto) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir
      </Button>
    </div>
  )
}

function LibroDiarioTab() {
  const getDefaultDate = (): { inicio: string; fin: string } => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      inicio: first.toISOString().split('T')[0] ?? '',
      fin: now.toISOString().split('T')[0] ?? '',
    }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)
  const { data, isLoading, isError, error, refetch } = useLibroDiario({ fechaInicio, fechaFin })

  const asientos = data?.asientos ?? []
  const {
    datosPagina: asientosPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(asientos, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando libro diario..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Fecha Inicio">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha Fin">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(
                  'libro-diario.csv',
                  ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Comprobante'],
                  data.asientos.map((a) => [
                    a.fecha,
                    a.codigo,
                    a.concepto,
                    a.tipo,
                    a.monto,
                    a.caja,
                    a.comprobante || '',
                  ])
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </Card>
      <Card>
        <div className="px-5 py-3 border-b border-border-subtle flex justify-between">
          <h3 className="text-sm font-semibold text-foreground">Asientos Contables</h3>
          <Badge variant="gray">{data.total} registros</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fecha
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Código
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Concepto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Caja
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Comprobante
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {asientosPagina.map((a) => (
                <tr key={a.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 text-sm">
                    {new Date(a.fecha).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{a.codigo}</td>
                  <td className="px-5 py-3">{a.concepto}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={a.tipo === 'INGRESO' ? 'green' : 'red'}>{a.tipo}</Badge>
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${a.tipo === 'INGRESO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {formatCurrency(a.monto)}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{a.caja}</td>
                  <td className="px-5 py-3 text-sm text-muted">{a.comprobante || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {data.asientos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

export function ArqueosTab() {
  const { data, isLoading, isError, error, refetch } = useReporteArqueos()
  const arqueos = data?.arqueos ?? []
  const {
    datosPagina: arqueosPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(arqueos, 15)
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando arqueos..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Arqueos</p>
          <p className="text-2xl font-bold">{data.resumen.total}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Aprobados</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.resumen.aprobados}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {data.resumen.pendientes}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Con Diferencia</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {data.resumen.conDiferencia}
          </p>
        </Card>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Código
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fecha
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Caja
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Saldo Sistema
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Saldo Físico
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Diferencia
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Aprobado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {arqueosPagina.map((a) => (
                <tr key={a.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{a.codigo}</td>
                  <td className="px-5 py-3 text-sm">
                    {new Date(a.fecha).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-5 py-3">{a.caja}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(a.saldoSistema)}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(a.saldoFisico)}</td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${a.diferencia === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {formatCurrency(a.diferencia)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={a.estado === 'APROBADO' ? 'green' : 'yellow'}>{a.estado}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{a.aprobadoPor || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {data.arqueos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir
      </Button>
    </div>
  )
}

function MovimientosCajaTab() {
  const [cajaId, setCajaId] = useState('')
  const [tipo, setTipo] = useState('')
  const { data: cajasData } = useCajas({ limit: 100 })
  const { data, isLoading, isError, error, refetch } = useMovimientosCaja({
    cajaId: cajaId ? Number(cajaId) : undefined,
    tipo: tipo || undefined,
  })
  const cajasOptions = (cajasData?.data || []).map((c: Caja) => ({
    value: String(c.id),
    label: c.nombre,
  }))
  const movimientos = data?.movimientos ?? []
  const {
    datosPagina: movimientosPagina,
    pagina,
    setPagina,
    totalPaginas,
    desde,
    hasta,
  } = usePaginacionCliente(movimientos, 15)

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando movimientos..." />
      </div>
    )
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Caja">
            <Select
              options={[{ value: '', label: 'Todas' }, ...cajasOptions]}
              value={cajaId}
              onChange={(e) => setCajaId(e.target.value)}
            />
          </FormField>
          <FormField label="Tipo">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'INGRESO', label: 'Ingresos' },
                { value: 'EGRESO', label: 'Egresos' },
              ]}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(
                  'movimientos-caja.csv',
                  ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método', 'Estado'],
                  data.movimientos.map((m) => [
                    m.fecha,
                    m.codigo,
                    m.concepto,
                    m.tipo,
                    m.monto,
                    m.caja,
                    m.metodoPago,
                    m.estado,
                  ])
                )
              }
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-muted">Total Movimientos</p>
          <p className="text-2xl font-bold">{data.resumen.total}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Ingresos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(data.resumen.ingresos)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-muted">Egresos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(data.resumen.egresos)}
          </p>
        </Card>
      </div>

      {data.resumen.porConcepto.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-foreground">Por Concepto</h3>
          </div>
          <div className="p-5 flex flex-wrap gap-4 text-sm">
            {data.resumen.porConcepto.map((c, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs text-muted">{c.concepto}</span>
                <span className="font-semibold">{formatCurrency(c.monto)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/60">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Fecha
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Código
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Concepto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Caja
                </th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {movimientosPagina.map((m) => (
                <tr key={m.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 text-sm">
                    {new Date(m.fecha).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{m.codigo}</td>
                  <td className="px-5 py-3">{m.concepto}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge>
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${m.tipo === 'INGRESO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {formatCurrency(m.monto)}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">{m.caja}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={m.estado === 'REGISTRADO' ? 'blue' : 'gray'}>{m.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-border-subtle px-5 py-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted">
            Mostrando {desde}–{hasta} de {data.movimientos.length}
          </p>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </div>
      </Card>
    </div>
  )
}

export default function ReportesPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const handleBack = () => setActiveReport(null)

  const reportComponents: Record<string, () => JSX.Element> = {
    cartera: CarteraTab,
    resultados: ResultadosTab,
    morosos: MorososTab,
    cuenta: EstadoCuentaTab,
    flujo: FlujoCajaTab,
    balance: BalanceGeneralTab,
    aging: AntiguedadCarteraTab,
    libro: LibroDiarioTab,
    movimientos: MovimientosCajaTab,
  }

  const reportTitles: Record<string, string> = {
    cartera: 'Cartera de Créditos',
    resultados: 'Estado de Resultados',
    morosos: 'Morosos',
    cuenta: 'Estado de Cuentas',
    flujo: 'Flujo de Caja',
    balance: 'Balance General',
    aging: 'Antigüedad de Cartera',
    libro: 'Libro Diario',
    movimientos: 'Movimientos de Caja',
  }

  if (activeReport && reportComponents[activeReport]) {
    const ReportComponent = reportComponents[activeReport]
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            Volver a Reportes
          </Button>
        </div>
        <SectionHeader title={reportTitles[activeReport] || ''} description="" />
        <ReportComponent />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Reportes" description="Selecciona un reporte para ver el detalle" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportCards.map((item) => {
          const colors = colorMap[item.color] || colorMap.blue || { bg: '', icon: '', border: '' }
          return (
            <Card
              key={item.id}
              padding="md"
              className={`cursor-pointer ${colors.border}`}
              onClick={() => setActiveReport(item.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
                >
                  <item.icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
