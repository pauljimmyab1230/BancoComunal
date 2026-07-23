import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Filter, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import {
  useCaja,
  useCajaResumen,
  useConceptos,
  useMovimientos,
  useArqueos,
  useCreateMovimiento,
  useCreateArqueo,
  useAprobarArqueo,
} from '../hooks/useCajas'
import { movimientoCreateSchema, arqueoCreateSchema, type MovimientoCreateInput, type ArqueoCreateInput } from '../validations'
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SectionHeader,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { MovimientoCaja, ArqueoCaja, ConceptoCaja } from '../types'

const filtroTipoOptions = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'INGRESO', label: 'Ingresos' },
  { value: 'EGRESO', label: 'Egresos' },
  { value: 'TRASPASO', label: 'Traspasos' },
]

const tipoMovimientoOptions = [
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'TRASPASO', label: 'Traspaso' },
]

export default function CajaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cajaId = Number(id)

  const { data: caja, isLoading: loadingCaja } = useCaja(cajaId)
  const { data: resumen } = useCajaResumen(cajaId)
  const { data: conceptos } = useConceptos()
  const { data: movimientos } = useMovimientos({ cajaId, limit: 50 })
  const { data: arqueos } = useArqueos({ cajaId, limit: 10 })

  const createMovimiento = useCreateMovimiento()
  const createArqueo = useCreateArqueo()
  const aprobarArqueo = useAprobarArqueo()

  const [showMovimientoModal, setShowMovimientoModal] = useState(false)
  const [showArqueoModal, setShowArqueoModal] = useState(false)
  const [showAprobarModal, setShowAprobarModal] = useState(false)
  const [selectedArqueoId, setSelectedArqueoId] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('TODOS')

  const movimientoForm = useForm<MovimientoCreateInput>({
    resolver: zodResolver(movimientoCreateSchema),
    defaultValues: {
      cajaId,
      conceptoId: 0,
      tipo: 'INGRESO',
      monto: 0,
      descripcion: '',
      referencia: '',
    },
  })

  const arqueoForm = useForm<ArqueoCreateInput>({
    resolver: zodResolver(arqueoCreateSchema),
    defaultValues: {
      cajaId,
      saldoFisico: 0,
      observacion: '',
    },
  })

  const aprobarForm = useForm<{ observacion?: string }>({
    defaultValues: { observacion: '' },
  })

  if (loadingCaja) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando caja..." />
      </div>
    )
  }

  if (!caja) {
    return (
      <EmptyState
        title="Caja no encontrada"
        description="La caja que buscas no existe o fue eliminada."
        actionLabel="Volver al listado"
        actionTo="/caja"
      />
    )
  }

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return <Badge variant="green">Activa</Badge>
      case 'INACTIVA':
        return <Badge variant="gray">Inactiva</Badge>
      case 'CERRADA':
        return <Badge variant="red">Cerrada</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const estadoArqueoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="yellow">Pendiente</Badge>
      case 'APROBADO':
        return <Badge variant="green">Aprobado</Badge>
      case 'RECHAZADO':
        return <Badge variant="red">Rechazado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const conceptoOptions = (conceptos || [])
    .filter((c: ConceptoCaja) => c.estado === 'ACTIVO')
    .map((c: ConceptoCaja) => ({ value: String(c.id), label: c.nombre }))

  const movimientosFiltrados = (movimientos?.data || []).filter((m: MovimientoCaja) => {
    if (filtroTipo === 'TODOS') return true
    return m.tipo === filtroTipo
  })

  const conceptoNombre = (conceptoId: number) => {
    const concepto = conceptos?.find((c: ConceptoCaja) => c.id === conceptoId)
    return concepto?.nombre || `Concepto #${conceptoId}`
  }

  const onSubmitMovimiento = (data: MovimientoCreateInput) => {
    createMovimiento.mutate(data, {
      onSuccess: () => {
        setShowMovimientoModal(false)
        movimientoForm.reset()
      },
    })
  }

  const onSubmitArqueo = (data: ArqueoCreateInput) => {
    createArqueo.mutate(data, {
      onSuccess: () => {
        setShowArqueoModal(false)
        arqueoForm.reset()
      },
    })
  }

  const onAprobarArqueo = (data: { observacion?: string }) => {
    if (!selectedArqueoId) return
    aprobarArqueo.mutate(
      { id: selectedArqueoId, data: { estado: 'APROBADO', observacion: data.observacion, aprobadorId: 1 } }, // TODO: Replace aprobadorId with auth user
      {
        onSuccess: () => {
          setShowAprobarModal(false)
          setSelectedArqueoId(null)
          aprobarForm.reset()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/caja')}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            Volver
          </Button>
          <SectionHeader
            title={`${caja.codigo} - ${caja.nombre}`}
            description={caja.descripcion || `Caja tipo ${caja.tipo}`}
          />
        </div>
        <div className="flex gap-2">
          {caja.estado === 'ACTIVA' && (
            <>
              <Button onClick={() => setShowMovimientoModal(true)} iconLeft={<Plus className="h-4 w-4" />}>
                Nuevo Movimiento
              </Button>
              <Button variant="secondary" onClick={() => setShowArqueoModal(true)}>
                Registrar Arqueo
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => navigate(`/caja/${cajaId}/editar`)}>
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo Actual</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(caja.saldoActual)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ingresos Hoy</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(resumen?.hoy?.ingresos || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Egresos Hoy</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(resumen?.hoy?.egresos || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Movimientos Hoy</p>
              <p className="text-lg font-bold text-gray-900">{resumen?.hoy?.movimientos || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Movimientos</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            options={filtroTipoOptions}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <div className="p-4">
          {movimientosFiltrados.length === 0 ? (
            <EmptyState
              title="No hay movimientos"
              description="Registra el primer movimiento de esta caja."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movimientosFiltrados.map((mov: MovimientoCaja) => (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(mov.fechaMovimiento).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={mov.tipo === 'INGRESO' ? 'green' : mov.tipo === 'EGRESO' ? 'red' : 'blue'}>
                          {mov.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{conceptoNombre(mov.conceptoId)}</td>
                      <td className="px-4 py-3 text-gray-600">{mov.descripcion || '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.monto)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={mov.estado === 'CONFIRMADO' ? 'green' : mov.estado === 'ANULADO' ? 'red' : 'yellow'}>
                          {mov.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Arqueos de Caja</h3>
      </div>

      <Card>
        <div className="p-4">
          {!arqueos?.data || arqueos.data.length === 0 ? (
            <EmptyState
              title="No hay arqueos"
              description="Registra el primer arqueo de esta caja."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Saldo Sistema</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Saldo Físico</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Diferencia</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {arqueos.data.map((arqueo: ArqueoCaja) => (
                    <tr key={arqueo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(arqueo.fechaArqueo).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(arqueo.saldoSistema)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(arqueo.saldoFisico)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${arqueo.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(arqueo.diferencia)}
                      </td>
                      <td className="px-4 py-3">{estadoArqueoBadge(arqueo.estado)}</td>
                      <td className="px-4 py-3">
                        {arqueo.estado === 'PENDIENTE' && (
                          <Button
        maxWidth="sm"
                            onClick={() => {
                              setSelectedArqueoId(arqueo.id)
                              setShowAprobarModal(true)
                            }}
                          >
                            Procesar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={showMovimientoModal}
        onClose={() => setShowMovimientoModal(false)}
        title="Nuevo Movimiento"
        maxWidth="md"
      >
        <form onSubmit={movimientoForm.handleSubmit(onSubmitMovimiento)} className="p-6 space-y-4">
          <FormField label="Tipo" error={movimientoForm.formState.errors.tipo?.message}>
            <Select options={tipoMovimientoOptions} {...movimientoForm.register('tipo')} />
          </FormField>

          <FormField label="Concepto" error={movimientoForm.formState.errors.conceptoId?.message}>
            <Select
              options={conceptoOptions}
              placeholder="Seleccionar concepto"
              {...movimientoForm.register('conceptoId', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Monto" error={movimientoForm.formState.errors.monto?.message}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...movimientoForm.register('monto', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Descripción" error={movimientoForm.formState.errors.descripcion?.message}>
            <Input
              {...movimientoForm.register('descripcion')}
              placeholder="Descripción del movimiento"
            />
          </FormField>

          <FormField label="Referencia" error={movimientoForm.formState.errors.referencia?.message}>
            <Input
              {...movimientoForm.register('referencia')}
              placeholder="N° recibo, comprobante, etc."
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowMovimientoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMovimiento.isPending}>
              Registrar Movimiento
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showArqueoModal}
        onClose={() => setShowArqueoModal(false)}
        title="Registrar Arqueo"
        maxWidth="md"
      >
        <form onSubmit={arqueoForm.handleSubmit(onSubmitArqueo)} className="p-6 space-y-4">
          <FormField label="Saldo Físico (contado)" error={arqueoForm.formState.errors.saldoFisico?.message}>
            <Input
              type="number"
              step="0.01"
              {...arqueoForm.register('saldoFisico', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Observaciones" error={arqueoForm.formState.errors.observacion?.message}>
            <Input
              {...arqueoForm.register('observacion')}
              placeholder="Observaciones del arqueo"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowArqueoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createArqueo.isPending}>
              Registrar Arqueo
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showAprobarModal}
        onClose={() => {
          setShowAprobarModal(false)
          setSelectedArqueoId(null)
        }}
        title="Procesar Arqueo"
        size="sm"
      >
        <form onSubmit={aprobarForm.handleSubmit(onAprobarArqueo)} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            ¿Deseas aprobar este arqueo? La diferencia se ajustará automáticamente.
          </p>

          <FormField label="Observaciones (opcional)">
            <Input
              {...aprobarForm.register('observacion')}
              placeholder="Observaciones de aprobación"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAprobarModal(false)
                setSelectedArqueoId(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={aprobarArqueo.isPending}>
              Aprobar Arqueo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}