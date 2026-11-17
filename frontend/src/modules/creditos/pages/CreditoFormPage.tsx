import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useController, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Save,
  ArrowLeft,
  Banknote,
  Table2,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Percent,
  HandCoins,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCrearCredito, useActualizarCredito, useCredito } from '../hooks/useCreditos'
import { prestamoFormSchema, type PrestamoFormValues } from '../schemas/creditoSchema'
import {
  Button,
  SectionHeader,
  Card,
  FormField,
  Input,
  Select,
  LoadingSpinner,
} from '@/components/ui'
import { resumenAmortizacion } from '@/lib/amortizacion'
import api from '@/lib/api'
import type { PrestamoFormData } from '../types'

const formatMonto = (monto: number, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)

const formatoFechaCorta = (fecha: Date) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    fecha
  )

const dosDigitos = (n: number) => String(n).padStart(2, '0')

const aISO = (d: Date) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`

const HOY_ISO = aISO(new Date())

const FECHA_PROXIMO_MES_ISO = (() => {
  const d = new Date()
  const dia = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + 1)
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(dia, ultimoDia))
  return aISO(d)
})()

interface FondoOption {
  id: number
  nombre: string
  moneda: string
  capitalDisponible: number
}

const PLAZOS_RAPIDOS = [3, 6, 12, 24]

function RevisionItem({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      <span className={ok ? 'text-muted' : 'text-amber-700 dark:text-amber-300'}>{children}</span>
    </li>
  )
}

export default function CreditoFormPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const isEditing = editingId !== null

  const createMutation = useCrearCredito()
  const updateMutation = useActualizarCredito(editingId || 0)
  const { data: prestamoData, isLoading: loadingPrestamo } = useCredito(editingId || 0)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PrestamoFormValues>({
    resolver: zodResolver(prestamoFormSchema),
    defaultValues: {
      monto: '',
      tasaInteres: '',
      numeroCuotas: '',
      fechaPrimerVencimiento: isEditing ? '' : FECHA_PROXIMO_MES_ISO,
      fondoId: '',
      socioId: '',
    },
  })

  const { field: fondoField } = useController({ name: 'fondoId', control })
  const { field: socioField } = useController({ name: 'socioId', control })

  const watchMonto = useWatch({ control, name: 'monto' })
  const watchTasa = useWatch({ control, name: 'tasaInteres' })
  const watchCuotas = useWatch({ control, name: 'numeroCuotas' })
  const watchFecha = useWatch({ control, name: 'fechaPrimerVencimiento' })

  const fondoId = fondoField.value || ''
  const socioIdStr = socioField.value || ''
  const socioId = socioIdStr ? Number(socioIdStr) : null

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select', { estado: 'ACTIVO' }],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100, estado: 'ACTIVO' } })
      return data.data as FondoOption[]
    },
  })

  const { data: sociosData } = useQuery({
    queryKey: ['socios-por-fondo', fondoId],
    queryFn: async () => {
      if (!fondoId) return []
      const { data } = await api.get(`/fondos/${fondoId}/socios`)
      return (data.data || []).map(
        (fs: import('@/modules/fondos/types').FondoSocio) => fs.socio
      ) as {
        id: number
        codigo: string
        nombres: string
        apellidoPaterno: string
        apellidoMaterno: string
      }[]
    },
    enabled: !!fondoId,
  })

  // Verificación temprana: el backend rechaza un segundo crédito activo del mismo socio.
  const { data: creditoActivoData } = useQuery({
    queryKey: ['credito-activo-socio', socioId],
    queryFn: async () => {
      const { data } = await api.get('/creditos', {
        params: { socioId, estado: 'ACTIVO', limit: 1 },
      })
      return data as { total: number }
    },
    enabled: !!socioId && !isEditing,
  })

  useEffect(() => {
    if (isEditing && prestamoData?.data) {
      const p = prestamoData.data
      reset({
        monto: String(p.monto),
        tasaInteres: String(p.tasaInteres),
        numeroCuotas: String(p.numeroCuotas),
        fechaPrimerVencimiento: p.fechaPrimerVencimiento.slice(0, 10),
        fondoId: String(p.fondo.id),
        socioId: String(p.socio.id),
      })
    }
  }, [isEditing, prestamoData, reset])

  const fondoSeleccionado = (fondosData || []).find((f) => String(f.id) === fondoId)
  const moneda = fondoSeleccionado?.moneda || prestamoData?.data?.fondo?.moneda || 'PEN'
  const capitalDisponible = Number(fondoSeleccionado?.capitalDisponible ?? 0)

  const fondoOptions = (fondosData || []).map((f) => ({
    value: String(f.id),
    label: `${f.nombre} (${f.moneda}) - Disp: ${formatMonto(Number(f.capitalDisponible), f.moneda)}`,
  }))
  if (
    isEditing &&
    prestamoData?.data &&
    !fondosData?.some((f) => f.id === prestamoData.data.fondo.id)
  ) {
    fondoOptions.unshift({
      value: String(prestamoData.data.fondo.id),
      label: `${prestamoData.data.fondo.nombre} (${prestamoData.data.fondo.moneda})`,
    })
  }

  const socioOptions = (sociosData || []).map((s) => ({
    value: String(s.id),
    label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
  }))
  if (
    isEditing &&
    prestamoData?.data &&
    !sociosData?.some((s) => s.id === prestamoData.data.socio.id)
  ) {
    socioOptions.unshift({
      value: String(prestamoData.data.socio.id),
      label: `${prestamoData.data.socio.codigo} - ${prestamoData.data.socio.nombres} ${prestamoData.data.socio.apellidoPaterno} ${prestamoData.data.socio.apellidoMaterno}`,
    })
  }

  const montoNum = Number(watchMonto)
  const tasaNum = Number(watchTasa)
  const cuotasNum = Number(watchCuotas)

  const montoValido = !isNaN(montoNum) && montoNum > 0
  const tasaValida = !isNaN(tasaNum) && tasaNum >= 0 && tasaNum <= 100
  const cuotasValidas = Number.isInteger(cuotasNum) && cuotasNum >= 1 && cuotasNum <= 60
  const fechaValida = !!watchFecha && !isNaN(new Date(`${watchFecha}T00:00:00`).getTime())
  const datosValidos = montoValido && tasaValida && cuotasValidas && fechaValida

  const fechaBase = new Date(`${watchFecha || FECHA_PROXIMO_MES_ISO}T00:00:00`)
  const resumen = datosValidos ? resumenAmortizacion(montoNum, tasaNum, cuotasNum, fechaBase) : null

  const fondoYSocioOk = !!fondoId && !!socioIdStr
  const capitalOk = !fondoSeleccionado || !montoValido || montoNum <= capitalDisponible
  const fechaOk = fechaValida && (isEditing || watchFecha >= HOY_ISO)
  const sinCreditoActivo = !creditoActivoData || creditoActivoData.total === 0

  const onSubmit = (values: PrestamoFormValues) => {
    const payload: PrestamoFormData = {
      monto: Number(values.monto),
      tasaInteres: Number(values.tasaInteres),
      numeroCuotas: Number(values.numeroCuotas),
      fechaPrimerVencimiento: values.fechaPrimerVencimiento,
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate({
        ...payload,
        fondoId: Number(values.fondoId),
        socioId: Number(values.socioId),
      })
    }
  }

  if (isEditing && loadingPrestamo) {
    return <LoadingSpinner text="Cargando crédito..." />
  }

  const submitting = isEditing ? updateMutation.isPending : createMutation.isPending

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
        <SectionHeader
          title={isEditing ? 'Editar Crédito' : 'Nuevo Crédito'}
          description={
            isEditing
              ? 'Modificar las condiciones del préstamo'
              : 'Registrar un préstamo para un socio'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" padding="lg">
          <form id="formulario-credito" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl bg-secondary/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isEditing ? 'Modificar Préstamo' : 'Nuevo Préstamo'}
                </p>
                <p className="text-xs text-muted">
                  Amortización francesa (cuota fija). Solo se puede editar antes de pagar la primera
                  cuota.
                </p>
              </div>
            </div>

            <div>
              <FormField label="Monto del Préstamo" required error={errors.monto?.message}>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('monto')}
                  error={errors.monto?.message}
                  placeholder="0.00"
                />
              </FormField>
              {fondoSeleccionado && (
                <p
                  className={`mt-1.5 text-xs ${
                    montoValido && montoNum > capitalDisponible
                      ? 'font-medium text-red-600 dark:text-red-400'
                      : 'text-subtle'
                  }`}
                >
                  Disponible en el fondo: {formatMonto(capitalDisponible, moneda)}
                  {montoValido && montoNum > capitalDisponible && ' · el monto excede el capital'}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Tasa de Interés (%) mensual"
                required
                error={errors.tasaInteres?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('tasaInteres')}
                  error={errors.tasaInteres?.message}
                  placeholder="Ej: 2.5"
                />
              </FormField>

              <FormField label="N° de Cuotas" required error={errors.numeroCuotas?.message}>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  {...register('numeroCuotas')}
                  error={errors.numeroCuotas?.message}
                  placeholder="Ej: 6"
                />
              </FormField>
            </div>

            <div className="flex flex-wrap gap-2">
              {PLAZOS_RAPIDOS.map((plazo) => (
                <button
                  key={plazo}
                  type="button"
                  onClick={() => setValue('numeroCuotas', String(plazo), { shouldValidate: true })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    String(plazo) === watchCuotas
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border text-muted hover:border-secondary/40 hover:text-foreground'
                  }`}
                >
                  {plazo} cuotas
                </button>
              ))}
            </div>

            <FormField
              label="Primer Vencimiento"
              required
              error={errors.fechaPrimerVencimiento?.message}
            >
              <Input
                type="date"
                min={isEditing ? undefined : HOY_ISO}
                {...register('fechaPrimerVencimiento')}
                error={errors.fechaPrimerVencimiento?.message}
              />
            </FormField>

            <div className="border-t border-border-subtle pt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-subtle">
                Fondo y socio <span className="font-normal normal-case">(obligatorio)</span>
              </p>
              <div className="space-y-4">
                <FormField label="Fondo Rotatorio" required error={errors.fondoId?.message}>
                  <Select
                    value={fondoField.value || ''}
                    onChange={(e) => {
                      fondoField.onChange(e.target.value)
                      socioField.onChange('')
                    }}
                    error={errors.fondoId?.message}
                    options={fondoOptions}
                    disabled={isEditing}
                    placeholder="Seleccione un fondo"
                  />
                </FormField>

                <FormField label="Socio" required error={errors.socioId?.message}>
                  <Select
                    value={socioField.value || ''}
                    onChange={(e) => socioField.onChange(e.target.value)}
                    error={errors.socioId?.message}
                    options={socioOptions}
                    disabled={isEditing || !fondoId}
                    placeholder={fondoId ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
                  />
                </FormField>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card padding="lg" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <Table2 className="h-5 w-5 text-secondary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Vista previa del cronograma
                </h2>
                <p className="text-xs text-muted">
                  Se recalcula automáticamente con las condiciones del préstamo.
                </p>
              </div>
            </div>

            {!resumen ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center">
                <Banknote className="mx-auto mb-3 h-8 w-8 text-subtle" />
                <p className="text-sm font-medium text-foreground">
                  Completa monto, tasa, cuotas y fecha
                </p>
                <p className="mt-1 text-xs text-muted">
                  Aquí verás la tabla de amortización antes de guardar el crédito.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Wallet className="h-3.5 w-3.5" /> Cuota fija
                    </div>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatMonto(resumen.montoCuota, moneda)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Percent className="h-3.5 w-3.5" /> Total intereses
                    </div>
                    <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-300">
                      {formatMonto(resumen.totalInteres, moneda)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <HandCoins className="h-3.5 w-3.5" /> Total a pagar
                    </div>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-300">
                      {formatMonto(resumen.totalPagar, moneda)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 max-h-[460px] overflow-auto rounded-xl border border-border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="sticky top-0 bg-surface-muted text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold">N°</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Vencimiento</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Cuota</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Interés</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Amortización</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {resumen.tabla.map((cuota) => (
                        <tr key={cuota.numero} className="hover:bg-surface-hover/50">
                          <td className="px-3 py-2 font-medium text-foreground">{cuota.numero}</td>
                          <td className="px-3 py-2 text-muted">
                            {formatoFechaCorta(cuota.fechaVencimiento)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-foreground">
                            {formatMonto(cuota.cuota, moneda)}
                          </td>
                          <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-300">
                            {formatMonto(cuota.interes, moneda)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted">
                            {formatMonto(cuota.amortizacion, moneda)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted">
                            {formatMonto(cuota.saldo, moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-xs text-subtle">
                  Vista previa referencial. El cronograma definitivo se genera al guardar el
                  crédito.
                </p>
              </>
            )}
          </Card>

          <Card padding="lg" hover={false}>
            <h2 className="mb-3 text-base font-semibold text-foreground">Revisión rápida</h2>
            <ul className="space-y-2">
              <RevisionItem ok={fondoYSocioOk}>
                {fondoYSocioOk ? 'Fondo y socio seleccionados' : 'Selecciona un fondo y un socio'}
              </RevisionItem>
              <RevisionItem ok={capitalOk}>
                {!fondoSeleccionado
                  ? 'Selecciona un fondo para validar el capital disponible'
                  : capitalOk
                    ? `Monto dentro del capital disponible (${formatMonto(capitalDisponible, moneda)})`
                    : `El monto excede el capital disponible (${formatMonto(capitalDisponible, moneda)})`}
              </RevisionItem>
              <RevisionItem ok={fechaOk}>
                {fechaValida
                  ? fechaOk
                    ? 'Fecha de vencimiento válida'
                    : 'La primera cuota no puede vencer antes de hoy'
                  : 'Ingresa la fecha del primer vencimiento'}
              </RevisionItem>
              {!isEditing && socioIdStr && (
                <RevisionItem ok={sinCreditoActivo}>
                  {sinCreditoActivo
                    ? 'Socio sin crédito activo'
                    : 'El socio ya tiene un crédito activo'}
                </RevisionItem>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Barra de acciones de ancho completo */}
      <div className="sticky bottom-0 z-20 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <Button as="link" to={isEditing ? `/creditos/${editingId}` : '/creditos'} variant="ghost">
          Cancelar
        </Button>

        <Button
          type="submit"
          form="formulario-credito"
          iconLeft={<Save className="h-4 w-4" />}
          loading={submitting}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Crédito'}
        </Button>
      </div>
    </div>
  )
}
