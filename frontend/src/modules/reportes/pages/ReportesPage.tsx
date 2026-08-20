import { useState } from 'react'
import { Search, TrendingUp, Users, DollarSign, AlertTriangle, Wallet, HandCoins, BarChart3, Printer, Download, FileText, ArrowDownCircle, ArrowUpCircle, Scale, Clock, BookOpen, Camera, WalletCards, ArrowLeft } from 'lucide-react'
import { useResumenEjecutivo, useCarteraCreditos, useEstadoResultados, useReporteAportes, useMorosos, useEstadoCuentasSocio, useFlujoCaja, useBalanceGeneral, useAntiguedadCartera, useLibroDiario, useReporteArqueos, useMovimientosCaja } from '../hooks/useReportes'
import { useFondos } from '@/modules/fondos/hooks/useFondos'
import { useCajas } from '@/modules/caja/hooks/useCajas'
import { Button, Card, FormField, Input, Select, SectionHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import { formatCurrency, formatSaldosPorMoneda, exportCsv, exportXlsx } from '@/lib/utils'
import { openProtectedPdf, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { ResumenEjecutivo, CarteraCreditoPrestamo, EstadoResultadosFondo, ReporteAporte, Moroso, CarteraCreditosQuery, ReporteAportesQuery } from '../types'

const reportCards = [
  { id: 'balance', label: 'Balance General', desc: 'Activos y patrimonio', icon: Scale, color: 'blue' },
  { id: 'resultados', label: 'Estado de Resultados', desc: 'Ingresos vs egresos', icon: TrendingUp, color: 'green' },
  { id: 'flujo', label: 'Flujo de Caja', desc: 'Movimientos de entrada y salida', icon: ArrowDownCircle, color: 'green' },
  { id: 'cartera', label: 'Cartera de Créditos', desc: 'Préstamos activos y saldos', icon: DollarSign, color: 'purple' },
  { id: 'aging', label: 'Antigüedad de Cartera', desc: 'Saldos por días de atraso', icon: Clock, color: 'purple' },
  { id: 'morosos', label: 'Morosos', desc: 'Socios con cuotas vencidas', icon: AlertTriangle, color: 'red' },
  { id: 'movimientos', label: 'Movimientos de Caja', desc: 'Detalle de transacciones', icon: WalletCards, color: 'green' },
  { id: 'libro', label: 'Libro Diario', desc: 'Log cronológico de asientos', icon: BookOpen, color: 'blue' },
  { id: 'cuenta', label: 'Estado de Cuentas', desc: 'Consulta por socio', icon: Users, color: 'orange' },
  { id: 'docs', label: 'Documentos PDF', desc: 'Fichas, comprobantes, padrón', icon: FileText, color: 'red' },
]

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'hover:border-blue-300' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'hover:border-purple-300' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'hover:border-green-300' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'hover:border-orange-300' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'hover:border-red-300' },
}

function ResumenTab() {
  const { data, isLoading } = useResumenEjecutivo()

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando resumen..." /></div>
  if (!data) return <EmptyState title="Sin datos" description="No se pudo cargar el resumen ejecutivo." />

  const r = data as ResumenEjecutivo

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Socios Activos</p>
              <p className="text-lg font-bold text-gray-900">{r.socios.activos} <span className="text-xs text-gray-400">/ {r.socios.total}</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50"><Wallet className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Saldo Total Cajas</p>
              <p className="text-lg font-bold text-green-600">{formatSaldosPorMoneda(r.totalSaldoCajasPorMoneda)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><DollarSign className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Cartera Activa</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(r.creditos.saldoPendiente)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Cuotas Vencidas</p>
              <p className="text-lg font-bold text-red-600">{r.creditos.cuotasVencidas} <span className="text-xs text-gray-400">({r.creditos.tasaMorosidad.toFixed(1)}%)</span></p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Créditos</h3></div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Préstamos activos</span><span className="text-sm font-medium">{r.creditos.activos}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Capital prestado</span><span className="text-sm font-medium">{formatCurrency(r.creditos.capitalPrestado)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Capital recuperado</span><span className="text-sm font-medium text-green-600">{formatCurrency(r.creditos.capitalRecuperado)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Saldo pendiente</span><span className="text-sm font-medium text-red-600">{formatCurrency(r.creditos.saldoPendiente)}</span></div>
          </div>
        </Card>
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Aportes</h3></div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Aportes del mes</span><span className="text-sm font-medium">{formatCurrency(r.aportes.mesActual)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Cuotas por vencer (7 días)</span><span className="text-sm font-medium">{r.cuotasPorVencer}</span></div>
          </div>
        </Card>
      </div>

      {r.cajas.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Estado de Cajas</h3>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => exportCsv('resumen-cajas.csv', ['Código', 'Nombre', 'Moneda', 'Saldo'], r.cajas.map(c => [c.codigo, c.nombre, c.moneda || 'PEN', c.saldoActual]))}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Nombre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Moneda</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Saldo</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {r.cajas.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs">{c.codigo}</td>
                    <td className="px-5 py-3">{c.nombre}</td>
                    <td className="px-5 py-3"><Badge variant="gray">{c.moneda || 'PEN'}</Badge></td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(c.saldoActual, c.moneda || 'PEN')}</td>
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
  const { data, isLoading } = useCarteraCreditos({
    estado,
    fondoId: fondoId ? Number(fondoId) : undefined,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando cartera..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const { resumen, prestamos } = data
  const fondosOptions = (fondosData?.data || []).map((f) => ({ value: String(f.id), label: f.nombre }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Préstamos Activos</p>
          <p className="text-lg font-bold">{resumen.prestamosActivos}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Monto Total</p>
          <p className="text-lg font-bold">{formatCurrency(resumen.montoTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Saldo Pendiente</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(resumen.saldoTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Tasa Morosidad</p>
          <p className="text-lg font-bold text-red-600">{resumen.tasaMorosidad.toFixed(1)}%</p>
        </Card>
      </div>

      <Card className="p-4">
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
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </FormField>
          <FormField label="Hasta">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportCsv('cartera-creditos.csv', ['Socio', 'Código', 'Fondo', 'Moneda', 'Monto', 'Pagado', 'Pendiente', 'Cuotas Pagadas', 'Cuotas Vencidas', 'Estado'], prestamos.map(p => [p.socio.nombres + ' ' + p.socio.apellidoPaterno, p.socio.codigo, p.fondo.nombre, p.moneda || '', p.monto, p.totalPagado, p.saldoPendiente, `${p.cuotasPagadas}/${p.numeroCuotas}`, p.cuotasVencidas, p.estado]))}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Socio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Moneda</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Pagado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Pendiente</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Cuotas</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {prestamos.map((p: CarteraCreditoPrestamo) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{p.socio.nombres} {p.socio.apellidoPaterno}</div>
                    <div className="text-xs text-gray-500">{p.socio.codigo}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.fondo.nombre}</td>
                  <td className="px-5 py-3"><Badge variant="gray">{p.moneda || 'PEN'}</Badge></td>
                  <td className="px-5 py-3 text-right">{formatCurrency(p.monto, p.moneda || 'PEN')}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(p.totalPagado, p.moneda || 'PEN')}</td>
                  <td className="px-5 py-3 text-right text-red-600 font-medium">{formatCurrency(p.saldoPendiente, p.moneda || 'PEN')}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm">{p.cuotasPagadas}/{p.numeroCuotas}</span>
                    {p.cuotasVencidas > 0 && <span className="ml-1 text-xs text-red-500">({p.cuotasVencidas} vencidas)</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={p.estado === 'ACTIVO' ? 'green' : p.estado === 'PAGADO' ? 'blue' : 'gray'}>{p.estado}</Badge>
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

function ResultadosTab() {
  const getDefaultDate = (): { inicio: string; fin: string } => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { inicio: first.toISOString().split('T')[0] ?? '', fin: now.toISOString().split('T')[0] ?? '' }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)

  const { data, isLoading } = useEstadoResultados({ fechaInicio, fechaFin })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando estado de resultados..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-end gap-4">
          <FormField label="Fecha Inicio">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </FormField>
          <FormField label="Fecha Fin">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </FormField>
          <Button variant="secondary" size="sm" onClick={() => exportCsv('estado-resultados.csv', ['Fondo', 'Moneda', 'Ingresos - Cuotas', 'Ingresos - Intereses', 'Ingresos - Reintegros', 'Ingresos - Otros', 'Total Ingresos', 'Egresos - Gastos', 'Egresos - Faltantes', 'Total Egresos', 'Resultado Neto'], data.fondos.map(f => [f.fondo.nombre, f.fondo.moneda, f.ingresos.cuotas, f.ingresos.intereses, f.ingresos.reintegros, f.ingresos.otros, f.ingresos.total, f.egresos.gastos, f.egresos.faltantes, f.egresos.total, f.resultadoNeto]))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Ingresos</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(data.totales.ingresos)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Egresos</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(data.totales.egresos)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Resultado Neto</p>
          <p className={`text-lg font-bold ${data.totales.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.totales.neto)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Ingresos por concepto</h3></div>
          <div className="p-5 space-y-2 text-sm">
            {data.fondos.reduce((rows, f) => {
              const push = (label: string, value: number) => {
                const existing = rows.find(r => r[0] === label)
                if (existing) existing[1] = (existing[1] as number) + value
                else rows.push([label, value])
              }
              push('Cuotas cobradas', f.ingresos.cuotas)
              push('Intereses', f.ingresos.intereses)
              push('Reintegros', f.ingresos.reintegros)
              push('Otros ingresos', f.ingresos.otros)
              return rows
            }, [] as [string, number][]).map(([label, value]) => (
              <div key={label} className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-medium text-green-600">{formatCurrency(value)}</span></div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Egresos por concepto</h3></div>
          <div className="p-5 space-y-2 text-sm">
            {data.fondos.reduce((rows, f) => {
              const push = (label: string, value: number) => {
                const existing = rows.find(r => r[0] === label)
                if (existing) existing[1] = (existing[1] as number) + value
                else rows.push([label, value])
              }
              push('Gastos operativos', f.egresos.gastos)
              push('Faltantes de arqueo', f.egresos.faltantes)
              return rows
            }, [] as [string, number][]).map(([label, value]) => (
              <div key={label} className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-medium text-red-600">{formatCurrency(value)}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Capital</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Ingresos</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Egresos</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Neto</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {data.fondos.map((f: EstadoResultadosFondo) => (
                <tr key={f.fondo.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{f.fondo.nombre}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(f.fondo.capitalDisponible)}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(f.ingresos.total)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{formatCurrency(f.egresos.total)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${f.resultadoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(f.resultadoNeto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function AportesTab() {
  const [tipo, setTipo] = useState<ReporteAportesQuery['tipo']>('TODOS')
  const { data, isLoading } = useReporteAportes({ tipo })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando aportes..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const { aportes, resumen } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Aportes</p>
          <p className="text-lg font-bold">{resumen.totalAportes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Monto Total</p>
          <p className="text-lg font-bold">{formatCurrency(resumen.montoTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Obligatorios</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(resumen.porTipo.obligatorio)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Extraordinarios</p>
          <p className="text-lg font-bold text-purple-600">{formatCurrency(resumen.porTipo.extraordinario)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Voluntarios</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(resumen.porTipo.voluntario)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Multas</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(resumen.porTipo.multa)}</p>
        </Card>
      </div>

      {Object.keys(resumen.porMetodo).length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Aportes por método de pago</h3></div>
          <div className="p-5 flex flex-wrap gap-4 text-sm">
            {Object.entries(resumen.porMetodo).map(([metodo, monto]) => (
              <div key={metodo} className="flex flex-col">
                <span className="text-xs text-gray-500">{metodo}</span>
                <span className="font-semibold">{formatCurrency(monto)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
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
          <Button variant="secondary" size="sm" onClick={() => exportCsv('reporte-aportes.csv', ['Socio', 'Código', 'Fondo', 'Periodo', 'Tipo', 'Monto', 'Fecha', 'Método'], aportes.map(a => [a.socio.nombres + ' ' + a.socio.apellidoPaterno, a.socio.codigo, a.fondo.nombre, a.periodo, a.tipo, a.monto, a.fechaAporte, a.metodoPago]))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Socio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Periodo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Tipo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {aportes.map((a: ReporteAporte) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{a.socio.nombres} {a.socio.apellidoPaterno}</div>
                    <div className="text-xs text-gray-500">{a.socio.codigo}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{a.fondo.nombre}</td>
                  <td className="px-5 py-3 text-sm font-mono">{a.periodo}</td>
                  <td className="px-5 py-3"><Badge variant={a.tipo === 'OBLIGATORIO' ? 'blue' : a.tipo === 'EXTRAORDINARIO' ? 'purple' : a.tipo === 'MULTA' ? 'red' : 'green'}>{a.tipo}</Badge></td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(a.monto)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{new Date(a.fechaAporte).toLocaleDateString('es-PE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function MorososTab() {
  const [diasMinimos, setDiasMinimos] = useState(1)
  const { data, isLoading } = useMorosos({ diasMinimos })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando morosos..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const { morosos, resumen } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Morosos</p>
          <p className="text-lg font-bold text-red-600">{resumen.totalMorosos}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Monto Adeudado</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(resumen.montoTotalAdeudado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Cuotas Vencidas</p>
          <p className="text-lg font-bold text-red-600">{resumen.cuotasVencidasTotal}</p>
        </Card>
      </div>

      <Card className="p-4">
        <FormField label="Días mínimos de atraso">
          <Input type="number" min="1" value={diasMinimos} onChange={(e) => setDiasMinimos(Number(e.target.value))} className="max-w-[120px]" />
        </FormField>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Socio</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Días Atraso</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Cuotas Vencidas</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto Adeudado</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Teléfono</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {morosos.map((m: Moroso, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{m.socio.nombres} {m.socio.apellidoPaterno}</div>
                    <div className="text-xs text-gray-500">{m.socio.codigo} - {m.socio.dni}</div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{m.fondo.nombre}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={m.diasMaxAtraso > 60 ? 'red' : m.diasMaxAtraso > 30 ? 'yellow' : 'blue'}>
                      {m.diasMaxAtraso} días
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-center font-medium">{m.cuotasAtrasadas}</td>
                  <td className="px-5 py-3 text-right font-medium text-red-600">{formatCurrency(m.montoAdeudado)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{m.socio.telefono || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function EstadoCuentaTab() {
  const [query, setQuery] = useState<{ socioId?: number; search?: string } | null>(null)
  const [socioSearch, setSocioSearch] = useState('')
  const { data, isLoading } = useEstadoCuentasSocio(query)

  const handleSearch = () => {
    const value = socioSearch.trim()
    if (!value) return
    const id = Number(value)
    setQuery(id > 0 ? { socioId: id } : { search: value })
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-end gap-4">
          <FormField label="ID, DNI o Código del Socio">
            <Input type="text" value={socioSearch} onChange={(e) => setSocioSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }} placeholder="Ej: 5, 45876123 o SOC-003" className="max-w-[260px]" />
          </FormField>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" /> Buscar
          </Button>
        </div>
      </Card>

      {!query && <EmptyState title="Busque un socio" description="Ingrese el ID, DNI o código del socio para ver su estado de cuentas." />}

      {query && isLoading && <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando estado de cuentas..." /></div>}

      {query && !isLoading && !data && <EmptyState title="Socio no encontrado" description="No se encontró un socio con ese ID, DNI o código." />}

      {data && (
        <div className="space-y-6">
          <Card>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-700">
                {data.socio.codigo} - {data.socio.nombres} {data.socio.apellidoPaterno} {data.socio.apellidoMaterno}
              </h3>
              <p className="text-xs text-gray-500 mt-1">DNI: {data.socio.dni} | Ingreso: {new Date(data.socio.fechaIngreso).toLocaleDateString('es-PE')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
              <div>
                <p className="text-xs text-gray-500">Total Aportes</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data.resumen.totalAportes)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Préstamos</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(data.resumen.totalPrestamos)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Deuda Total</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(data.resumen.totalDeuda)}</p>
              </div>
            </div>
          </Card>

          {data.prestamos.length > 0 && (
            <Card>
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Préstamos</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fondo</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Cuotas</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.prestamos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">{p.fondo.nombre}</td>
                        <td className="px-5 py-3 text-right">{formatCurrency(p.monto)}</td>
                        <td className="px-5 py-3 text-center">{p.cuotas.length}/{p.numeroCuotas}</td>
                        <td className="px-5 py-3 text-center"><Badge variant={p.estado === 'ACTIVO' ? 'green' : 'gray'}>{p.estado}</Badge></td>
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
    return { inicio: first.toISOString().split('T')[0] ?? '', fin: now.toISOString().split('T')[0] ?? '' }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)
  const [cajaId, setCajaId] = useState('')
  const { data: cajasData } = useCajas({ limit: 100 })
  const { data, isLoading } = useFlujoCaja({ fechaInicio, fechaFin, cajaId: cajaId ? Number(cajaId) : undefined })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando flujo de caja..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const cajasOptions = (cajasData?.data || []).map((c: any) => ({ value: String(c.id), label: c.nombre }))

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Fecha Inicio"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></FormField>
          <FormField label="Fecha Fin"><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></FormField>
          <FormField label="Caja"><Select options={[{ value: '', label: 'Todas' }, ...cajasOptions]} value={cajaId} onChange={(e) => setCajaId(e.target.value)} /></FormField>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportCsv('flujo-caja.csv', ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método'], data.movimientos.map(m => [m.fecha, m.codigo, m.concepto, m.tipo, m.monto, m.caja, m.metodoPago]))}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => exportXlsx('flujo-caja.xlsx', ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método'], data.movimientos.map(m => [m.fecha, m.codigo, m.concepto, m.tipo, m.monto, m.caja, m.metodoPago]))}><Download className="h-4 w-4 mr-1" /> Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Ingresos</p><p className="text-lg font-bold text-green-600">{formatCurrency(data.resumen.totalIngresos)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Total Egresos</p><p className="text-lg font-bold text-red-600">{formatCurrency(data.resumen.totalEgresos)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Flujo Neto</p><p className={`text-lg font-bold ${data.resumen.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.resumen.flujoNeto)}</p></Card>
      </div>

      {data.porCaja.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Por Caja</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Ingresos</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Egresos</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Saldo</th>
            </tr></thead><tbody className="divide-y divide-gray-50">
              {data.porCaja.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{c.caja}</td>
                  <td className="px-5 py-3 text-right text-green-600">{formatCurrency(c.ingresos)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{formatCurrency(c.egresos)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${c.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(c.saldo)}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </Card>
      )}

      <Card>
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Detalle de Movimientos</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Concepto</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Tipo</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {data.movimientos.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm">{new Date(m.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-5 py-3 font-mono text-xs">{m.codigo}</td>
                <td className="px-5 py-3">{m.concepto}</td>
                <td className="px-5 py-3 text-center"><Badge variant={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge></td>
                <td className={`px-5 py-3 text-right font-medium ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.monto)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.caja}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
    </div>
  )
}

function BalanceGeneralTab() {
  const { data, isLoading } = useBalanceGeneral()
  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando balance general..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const cuadra = data.activos.total === data.patrimonio.total

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Activos</p><p className="text-lg font-bold text-blue-600">{formatCurrency(data.activos.total)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Total Patrimonio</p><p className="text-lg font-bold text-green-600">{formatCurrency(data.patrimonio.total)}</p></Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Ecuación Contable</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={cuadra ? 'green' : 'red'}>{cuadra ? 'CUADRA' : 'NO CUADRA'}</Badge>
            <span className="text-xs text-gray-500">A = P</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">ACTIVOS</h3></div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Cajas (Efectivo)</span><span className="font-medium">{formatCurrency(data.activos.cajas)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cartera de Créditos</span><span className="font-medium">{formatCurrency(data.activos.cartera)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Activos</span><span className="font-bold text-blue-600">{formatCurrency(data.activos.total)}</span></div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">PATRIMONIO</h3></div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Capital Inicial</span><span className="font-medium">{formatCurrency(data.patrimonio.capitalInicial)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Aportes Acumulados</span><span className="font-medium text-green-600">{formatCurrency(data.patrimonio.aportes)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Interés Ganado</span><span className="font-medium text-green-600">{formatCurrency(data.patrimonio.interesGanado)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gastos Operativos</span><span className="font-medium text-red-600">({formatCurrency(data.patrimonio.gastosOperativos)})</span></div>
            {data.patrimonio.capitalPrestadoActivo > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Capital Prestado Activo</span><span className="font-medium text-amber-600">({formatCurrency(data.patrimonio.capitalPrestadoActivo)})</span></div>
            )}
            <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Resultado del Ejercicio</span><span className={`font-medium ${data.patrimonio.resultadoEjercicio >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.patrimonio.resultadoEjercicio)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Patrimonio</span><span className="font-bold text-green-600">{formatCurrency(data.patrimonio.total)}</span></div>
          </div>
        </Card>
      </div>
      <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
    </div>
  )
}

function AntiguedadCarteraTab() {
  const { data, isLoading } = useAntiguedadCartera()
  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando antigüedad de cartera..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  const rangoColors: Record<string, string> = { '0-30': 'green', '31-60': 'blue', '61-90': 'yellow', '90+': 'red' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Cuotas Pendientes</p><p className="text-lg font-bold">{data.total.cantidad}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Monto Total Pendiente</p><p className="text-lg font-bold text-red-600">{formatCurrency(data.total.monto)}</p></Card>
      </div>
      <Card>
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Antigüedad por Rango de Días</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Rango de Días</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Cantidad Cuotas</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">% del Total</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {data.rangos.map((r) => (
              <tr key={r.rango} className="hover:bg-gray-50">
                <td className="px-5 py-3"><Badge variant={(rangoColors[r.rango] as any) || 'gray'}>{r.rango} días</Badge></td>
                <td className="px-5 py-3 text-center font-medium">{r.cantidad}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(r.monto)}</td>
                <td className="px-5 py-3 text-right text-sm text-gray-600">{data.total.monto > 0 ? ((r.monto / data.total.monto) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
      <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
    </div>
  )
}

function LibroDiarioTab() {
  const getDefaultDate = (): { inicio: string; fin: string } => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { inicio: first.toISOString().split('T')[0] ?? '', fin: now.toISOString().split('T')[0] ?? '' }
  }
  const dates = getDefaultDate()
  const [fechaInicio, setFechaInicio] = useState(dates.inicio)
  const [fechaFin, setFechaFin] = useState(dates.fin)
  const { data, isLoading } = useLibroDiario({ fechaInicio, fechaFin })

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando libro diario..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Fecha Inicio"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></FormField>
          <FormField label="Fecha Fin"><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></FormField>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportCsv('libro-diario.csv', ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Comprobante'], data.asientos.map(a => [a.fecha, a.codigo, a.concepto, a.tipo, a.monto, a.caja, a.comprobante || '']))}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
          </div>
        </div>
      </Card>
      <Card>
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Asientos Contables</h3>
          <Badge variant="gray">{data.total} registros</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Concepto</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Tipo</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Comprobante</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {data.asientos.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm">{new Date(a.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-5 py-3 font-mono text-xs">{a.codigo}</td>
                <td className="px-5 py-3">{a.concepto}</td>
                <td className="px-5 py-3 text-center"><Badge variant={a.tipo === 'INGRESO' ? 'green' : 'red'}>{a.tipo}</Badge></td>
                <td className={`px-5 py-3 text-right font-medium ${a.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(a.monto)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{a.caja}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{a.comprobante || '—'}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
    </div>
  )
}

function ArqueosTab() {
  const { data, isLoading } = useReporteArqueos()
  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando arqueos..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Arqueos</p><p className="text-lg font-bold">{data.resumen.total}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Aprobados</p><p className="text-lg font-bold text-green-600">{data.resumen.aprobados}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Pendientes</p><p className="text-lg font-bold text-yellow-600">{data.resumen.pendientes}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Con Diferencia</p><p className="text-lg font-bold text-red-600">{data.resumen.conDiferencia}</p></Card>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Saldo Sistema</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Saldo Físico</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Diferencia</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Aprobado por</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {data.arqueos.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs">{a.codigo}</td>
                <td className="px-5 py-3 text-sm">{new Date(a.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-5 py-3">{a.caja}</td>
                <td className="px-5 py-3 text-right">{formatCurrency(a.saldoSistema)}</td>
                <td className="px-5 py-3 text-right">{formatCurrency(a.saldoFisico)}</td>
                <td className={`px-5 py-3 text-right font-medium ${a.diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(a.diferencia)}</td>
                <td className="px-5 py-3 text-center"><Badge variant={a.estado === 'APROBADO' ? 'green' : 'yellow'}>{a.estado}</Badge></td>
                <td className="px-5 py-3 text-sm text-gray-600">{a.aprobadoPor || '—'}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
      <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
    </div>
  )
}

function MovimientosCajaTab() {
  const [cajaId, setCajaId] = useState('')
  const [tipo, setTipo] = useState('')
  const { data: cajasData } = useCajas({ limit: 100 })
  const { data, isLoading } = useMovimientosCaja({ cajaId: cajaId ? Number(cajaId) : undefined, tipo: tipo || undefined })
  const cajasOptions = (cajasData?.data || []).map((c: any) => ({ value: String(c.id), label: c.nombre }))

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner text="Cargando movimientos..." /></div>
  if (!data) return <EmptyState title="Sin datos" />

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="Caja"><Select options={[{ value: '', label: 'Todas' }, ...cajasOptions]} value={cajaId} onChange={(e) => setCajaId(e.target.value)} /></FormField>
          <FormField label="Tipo"><Select options={[{ value: '', label: 'Todos' }, { value: 'INGRESO', label: 'Ingresos' }, { value: 'EGRESO', label: 'Egresos' }]} value={tipo} onChange={(e) => setTipo(e.target.value)} /></FormField>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportCsv('movimientos-caja.csv', ['Fecha', 'Código', 'Concepto', 'Tipo', 'Monto', 'Caja', 'Método', 'Estado'], data.movimientos.map(m => [m.fecha, m.codigo, m.concepto, m.tipo, m.monto, m.caja, m.metodoPago, m.estado]))}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Movimientos</p><p className="text-lg font-bold">{data.resumen.total}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Ingresos</p><p className="text-lg font-bold text-green-600">{formatCurrency(data.resumen.ingresos)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Egresos</p><p className="text-lg font-bold text-red-600">{formatCurrency(data.resumen.egresos)}</p></Card>
      </div>

      {data.resumen.porConcepto.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Por Concepto</h3></div>
          <div className="p-5 flex flex-wrap gap-4 text-sm">
            {data.resumen.porConcepto.map((c, i) => (
              <div key={i} className="flex flex-col"><span className="text-xs text-gray-500">{c.concepto}</span><span className="font-semibold">{formatCurrency(c.monto)}</span></div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Concepto</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Tipo</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Caja</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
          </tr></thead><tbody className="divide-y divide-gray-50">
            {data.movimientos.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm">{new Date(m.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-5 py-3 font-mono text-xs">{m.codigo}</td>
                <td className="px-5 py-3">{m.concepto}</td>
                <td className="px-5 py-3 text-center"><Badge variant={m.tipo === 'INGRESO' ? 'green' : 'red'}>{m.tipo}</Badge></td>
                <td className={`px-5 py-3 text-right font-medium ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.monto)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.caja}</td>
                <td className="px-5 py-3 text-center"><Badge variant={m.estado === 'REGISTRADO' ? 'blue' : 'gray'}>{m.estado}</Badge></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
    </div>
  )
}

function DocumentosTab() {
  const [socioSearch, setSocioSearch] = useState('')
  const [fondoId, setFondoId] = useState('')
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const { data: fondosData } = useFondos({ limit: 1000 })
  const fondosOptions = (fondosData?.data || []).map((f: any) => ({ value: String(f.id), label: f.nombre }))

  const pdfs = [
    { label: 'Ficha de Socio', desc: 'Perfil individual del socio', icon: Users, action: () => openPdf(`/reportes/ficha-socio/pdf?socioId=${socioSearch}`) },
    { label: 'Historial de Aportes (Socio)', desc: 'Aportes de un socio', icon: HandCoins, action: () => openPdf(`/reportes/aportes-socio/pdf?socioId=${socioSearch}`) },
    { label: 'Historial de Créditos (Socio)', desc: 'Créditos de un socio', icon: DollarSign, action: () => openPdf(`/reportes/creditos-socio/pdf?socioId=${socioSearch}`) },
    { label: 'Estado de Cuenta (Socio)', desc: 'Estado de cuentas completo', icon: FileText, action: () => openPdf(`/reportes/estado-cuenta-socio/pdf?socioId=${socioSearch}`) },
    { label: 'Comprobante de Aporte', desc: 'Comprobante de ingreso', icon: FileText, action: () => openPdf(`/reportes/comprobante-aporte/pdf?aporteId=${socioSearch}`) },
    { label: 'Padrón de Fondo', desc: 'Listado de socios del fondo', icon: Users, action: () => fondoId && openPdf(`/reportes/padron-fondo/pdf?fondoId=${fondoId}`) },
    { label: 'Resumen de Fondo', desc: 'Resumen anual del fondo', icon: BarChart3, action: () => fondoId && openPdf(`/reportes/resumen-fondo/pdf?fondoId=${fondoId}`) },
    { label: 'Aportes por Fondo', desc: 'Historial de aportes del fondo', icon: HandCoins, action: () => fondoId && openPdf(`/reportes/aportes-fondo/pdf?fondoId=${fondoId}&anio=${anio}`) },
  ]

  const openPdf = async (url: string) => {
    try { await openProtectedPdf(url) }
    catch { toast.error('Error al generar el PDF') }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Parámetros</h3>
        <div className="flex items-end gap-4 flex-wrap">
          <FormField label="ID Socio / Aporte"><Input value={socioSearch} onChange={(e) => setSocioSearch(e.target.value)} placeholder="ID numérico" className="max-w-[160px]" /></FormField>
          <FormField label="Fondo"><Select options={[{ value: '', label: 'Seleccione...' }, ...fondosOptions]} value={fondoId} onChange={(e) => setFondoId(e.target.value)} /></FormField>
          <FormField label="Año"><Input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className="max-w-[100px]" /></FormField>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pdfs.map((pdf) => (
          <Card key={pdf.label} className="p-4 hover:border-[#2563EB]/30 transition-colors cursor-pointer" onClick={pdf.action}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><pdf.icon className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{pdf.label}</p>
                <p className="text-xs text-gray-500">{pdf.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
    docs: DocumentosTab,
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
    docs: 'Documentos PDF',
  }

  if (activeReport && reportComponents[activeReport]) {
    const ReportComponent = reportComponents[activeReport]
    return (
      <div>
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} iconLeft={<ArrowLeft className="h-4 w-4" />}>
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
          const colors = colorMap[item.color] || colorMap.blue
          return (
            <Card
              key={item.id}
              className={`p-5 cursor-pointer transition-all hover:shadow-md ${colors.border}`}
              onClick={() => setActiveReport(item.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
                  <item.icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
