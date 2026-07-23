import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Filter, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'
import { useFlujoCaja } from '../hooks/useTesoreria'
import { useCajas } from '@/modules/caja/hooks/useCajas'
import { flujoCajaParamsSchema, type FlujoCajaFormInput } from '../validations'
import { Button, Card, FormField, Input, Select, SectionHeader, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { FlujoCajaGrupo } from '../types'

const agruparPorOptions = [
  { value: 'DIA', label: 'Día' },
  { value: 'SEMANA', label: 'Semana' },
  { value: 'MES', label: 'Mes' },
  { value: 'CONCEPTO', label: 'Concepto' },
]

const tipoOptions = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'INGRESO', label: 'Solo Ingresos' },
  { value: 'EGRESO', label: 'Solo Egresos' },
]

const tabs = [
  { id: 'flujo', label: 'Flujo de Caja' },
  { id: 'resumen', label: 'Resumen' },
]

function FlujoCajaTab() {
  const { data: cajasData } = useCajas({ limit: 50 })
  const cajaOptions = [
    { value: '0', label: 'Todas las cajas' },
    ...(cajasData?.data?.map((c: any) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` })) || []),
  ]

  const getDefaultDate = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { inicio: first.toISOString().split('T')[0], fin: now.toISOString().split('T')[0] }
  }

  const dates = getDefaultDate()

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<FlujoCajaFormInput>({
    resolver: zodResolver(flujoCajaParamsSchema),
    defaultValues: {
      fechaInicio: dates.inicio,
      fechaFin: dates.fin,
      agruparPor: 'DIA',
      tipo: 'TODOS',
    },
  })

  const formValues = watch()

  const queryParams = {
    ...formValues,
    cajaId: formValues.cajaId && formValues.cajaId > 0 ? formValues.cajaId : undefined,
  }

  const { data: grupos, isLoading } = useFlujoCaja(queryParams)

  const totalIngresos = grupos?.reduce((a: number, g: FlujoCajaGrupo) => a + g.ingresos, 0) || 0
  const totalEgresos = grupos?.reduce((a: number, g: FlujoCajaGrupo) => a + g.egresos, 0) || 0
  const totalMovimientos = grupos?.reduce((a: number, g: FlujoCajaGrupo) => a + g.movimientos, 0) || 0

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <FormField label="Fecha Inicio">
            <Input type="date" {...register('fechaInicio')} />
          </FormField>
          <FormField label="Fecha Fin">
            <Input type="date" {...register('fechaFin')} />
          </FormField>
          <FormField label="Caja">
            <Select options={cajaOptions} {...register('cajaId', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Agrupar por">
            <Select options={agruparPorOptions} {...register('agruparPor')} />
          </FormField>
          <FormField label="Tipo">
            <Select options={tipoOptions} {...register('tipo')} />
          </FormField>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Ingresos</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Egresos</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Neto / Movimientos</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalIngresos - totalEgresos)}
                <span className="text-xs font-normal text-gray-500 ml-2">({totalMovimientos} movs)</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Cargando flujo de caja..." />
        </div>
      ) : !grupos || grupos.length === 0 ? (
        <EmptyState
          title="Sin datos en el periodo"
          description="No se encontraron movimientos en el rango de fechas seleccionado."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {formValues.agruparPor === 'CONCEPTO' ? 'Concepto' : 'Periodo'}
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ingresos
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Egresos
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Neto
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Movs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grupos.map((grupo: FlujoCajaGrupo) => (
                  <tr key={grupo.grupo} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#111827]">{grupo.grupo}</td>
                    <td className="px-5 py-4 text-right text-green-600 font-medium">
                      {grupo.ingresos > 0 ? formatCurrency(grupo.ingresos) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-red-600 font-medium">
                      {grupo.egresos > 0 ? formatCurrency(grupo.egresos) : '—'}
                    </td>
                    <td className={`px-5 py-4 text-right font-semibold ${grupo.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(grupo.neto)}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-500">{grupo.movimientos}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td className="px-5 py-4 font-bold text-[#111827]">TOTALES</td>
                  <td className="px-5 py-4 text-right font-bold text-green-600">{formatCurrency(totalIngresos)}</td>
                  <td className="px-5 py-4 text-right font-bold text-red-600">{formatCurrency(totalEgresos)}</td>
                  <td className={`px-5 py-4 text-right font-bold ${totalIngresos - totalEgresos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalIngresos - totalEgresos)}
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-gray-700">{totalMovimientos}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {grupos && grupos.length > 0 && grupos.some((g: FlujoCajaGrupo) => g.detalle.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detalle por Grupo</h3>
          {grupos.filter((g: FlujoCajaGrupo) => g.detalle.length > 0).map((grupo: FlujoCajaGrupo) => (
            <Card key={grupo.grupo}>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="text-sm font-semibold text-gray-700">{grupo.grupo}</span>
                <span className="text-xs text-gray-500 ml-2">({grupo.movimientos} movimientos)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Fecha</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Código</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Concepto</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Descripción</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500">Monto</th>
                      <th className="px-5 py-2.5 text-center text-xs font-semibold text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grupo.detalle.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-600">
                          {new Date(mov.fechaMovimiento).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">{mov.codigo}</td>
                        <td className="px-5 py-3 text-gray-600">{mov.concepto?.nombre || '—'}</td>
                        <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">{mov.descripcion || '—'}</td>
                        <td className={`px-5 py-3 text-right font-medium ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.monto)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={mov.estado === 'CONFIRMADO' ? 'green' : mov.estado === 'ANULADO' ? 'red' : 'yellow'}>
                            {mov.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ResumenTab() {
  return (
    <EmptyState
      title="Resumen de Tesorería"
      description="Vista general del estado financiero. Próximamente con gráficos y métricas."
    />
  )
}

export default function TesoreriaPage() {
  const [activeTab, setActiveTab] = useState('flujo')

  return (
    <div>
      <SectionHeader
        title="Tesorería"
        description="Gestión y análisis del flujo financiero"
      />

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'flujo' && <FlujoCajaTab />}
      {activeTab === 'resumen' && <ResumenTab />}
    </div>
  )
}