import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useController, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, ArrowLeft, Calculator, CheckCircle2, Table2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  useCrearCotizacion,
  useActualizarCotizacion,
  useCotizacion,
} from '../hooks/useCotizaciones'
import { cotizacionFormSchema, type CotizacionFormValues } from '../schemas/cotizacionSchema'
import {
  Button,
  SectionHeader,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
} from '@/components/ui'
import { resumenAmortizacion } from '@/lib/amortizacion'
import api from '@/lib/api'
import type { CotizacionFormData } from '../types'

const formatMonto = (monto: number, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)

const formatoFechaCorta = (fecha: Date) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    fecha
  )

interface FondoOption {
  id: number
  nombre: string
  moneda: string
  capitalDisponible: number
}

const PLAZOS_RAPIDOS = [3, 6, 12, 24]

export default function CotizacionFormPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const isEditing = editingId !== null

  const createMutation = useCrearCotizacion()
  const updateMutation = useActualizarCotizacion(editingId || 0)
  const { data: cotizacionData, isLoading: loadingCotizacion } = useCotizacion(editingId || 0)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CotizacionFormValues>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      monto: '',
      tasaInteres: '',
      numeroCuotas: '',
      fechaPrimerVencimiento: '',
      fondoId: '',
      socioId: '',
      observacion: '',
    },
  })

  const { field: fondoField } = useController({ name: 'fondoId', control })
  const { field: socioField } = useController({ name: 'socioId', control })

  const watchMonto = useWatch({ control, name: 'monto' })
  const watchTasa = useWatch({ control, name: 'tasaInteres' })
  const watchCuotas = useWatch({ control, name: 'numeroCuotas' })
  const watchFecha = useWatch({ control, name: 'fechaPrimerVencimiento' })

  const fondoId = fondoField.value

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

  useEffect(() => {
    if (isEditing && cotizacionData?.data) {
      const c = cotizacionData.data
      reset({
        monto: String(c.monto),
        tasaInteres: String(c.tasaInteres),
        numeroCuotas: String(c.numeroCuotas),
        fechaPrimerVencimiento: c.fechaPrimerVencimiento.slice(0, 10),
        fondoId: c.fondoId ? String(c.fondoId) : '',
        socioId: c.socioId ? String(c.socioId) : '',
        observacion: c.observacion || '',
      })
    }
  }, [isEditing, cotizacionData, reset])

  const monedaFondo = (idFondo: string) => {
    const f = (fondosData || []).find((x) => String(x.id) === idFondo)
    return f?.moneda || 'PEN'
  }
  const moneda = monedaFondo(fondoId || '')

  const fondoOptions = (fondosData || []).map((f) => ({
    value: String(f.id),
    label: `${f.nombre} (${f.moneda})`,
  }))
  if (
    isEditing &&
    cotizacionData?.data?.fondo &&
    !fondosData?.some((f) => f.id === cotizacionData.data.fondo?.id)
  ) {
    fondoOptions.unshift({
      value: String(cotizacionData.data.fondo.id),
      label: `${cotizacionData.data.fondo.nombre} (${cotizacionData.data.fondo.moneda})`,
    })
  }

  const socioOptions = (sociosData || []).map((s) => ({
    value: String(s.id),
    label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
  }))
  if (
    isEditing &&
    cotizacionData?.data?.socio &&
    !sociosData?.some((s) => s.id === cotizacionData.data.socio?.id)
  ) {
    const s = cotizacionData.data.socio
    socioOptions.unshift({
      value: String(s.id),
      label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
    })
  }

  const montoNum = Number(watchMonto)
  const tasaNum = Number(watchTasa)
  const cuotasNum = Number(watchCuotas)
  const datosValidos =
    !isNaN(montoNum) &&
    montoNum > 0 &&
    !isNaN(tasaNum) &&
    tasaNum >= 0 &&
    Number.isInteger(cuotasNum) &&
    cuotasNum >= 1 &&
    cuotasNum <= 60

  const fechaBase = (() => {
    if (watchFecha) {
      const f = new Date(`${watchFecha}T00:00:00`)
      if (!isNaN(f.getTime())) return f
    }
    const proximoMes = new Date()
    proximoMes.setMonth(proximoMes.getMonth() + 1)
    return proximoMes
  })()

  const resumen = datosValidos ? resumenAmortizacion(montoNum, tasaNum, cuotasNum, fechaBase) : null

  const onSubmit = (values: CotizacionFormValues, aprobar = false) => {
    const payload: CotizacionFormData = {
      monto: Number(values.monto),
      tasaInteres: Number(values.tasaInteres),
      numeroCuotas: Number(values.numeroCuotas),
      fechaPrimerVencimiento: values.fechaPrimerVencimiento,
      fondoId: values.fondoId ? Number(values.fondoId) : null,
      socioId: values.socioId ? Number(values.socioId) : null,
      observacion: values.observacion || '',
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate({ data: payload, aprobar })
    }
  }

  if (isEditing && loadingCotizacion) {
    return <LoadingSpinner text="Cargando cotización..." />
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
          title={isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
          description={
            isEditing
              ? 'Ajusta las condiciones de la cotización'
              : 'Simula un crédito sin desembolsar dinero'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" padding="lg">
          <form
            id="formulario-cotizacion"
            onSubmit={handleSubmit((v) => onSubmit(v))}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 rounded-xl bg-secondary/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Datos de la simulación</p>
                <p className="text-xs text-muted">
                  Amortización francesa (cuota fija). No se registra ningún préstamo ni movimiento
                  de capital.
                </p>
              </div>
            </div>

            <FormField label="Monto a cotizar" required error={errors.monto?.message}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('monto')}
                error={errors.monto?.message}
                placeholder="0.00"
              />
            </FormField>

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
                {...register('fechaPrimerVencimiento')}
                error={errors.fechaPrimerVencimiento?.message}
              />
            </FormField>

            <div className="border-t border-border-subtle pt-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-subtle">
                Datos opcionales del cliente
              </p>
              <div className="space-y-4">
                <FormField label="Fondo Rotatorio" error={errors.fondoId?.message}>
                  <Select
                    value={fondoField.value || ''}
                    onChange={(e) => {
                      fondoField.onChange(e.target.value)
                      socioField.onChange('')
                    }}
                    error={errors.fondoId?.message}
                    options={fondoOptions}
                    placeholder="Sin fondo asignado"
                  />
                </FormField>

                <FormField label="Socio" error={errors.socioId?.message}>
                  <Select
                    value={socioField.value || ''}
                    onChange={(e) => socioField.onChange(e.target.value)}
                    error={errors.socioId?.message}
                    options={socioOptions}
                    disabled={!fondoId}
                    placeholder={fondoId ? 'Sin socio asignado' : 'Primero seleccione un fondo'}
                  />
                </FormField>

                <FormField label="Observación" error={errors.observacion?.message}>
                  <Textarea
                    {...register('observacion')}
                    error={errors.observacion?.message}
                    rows={3}
                    placeholder="Notas para la cotización (opcional)"
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
              <h2 className="text-base font-semibold text-foreground">Vista previa</h2>
            </div>

            {!resumen ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center">
                <Calculator className="mx-auto mb-3 h-8 w-8 text-subtle" />
                <p className="text-sm font-medium text-foreground">Completa monto, tasa y cuotas</p>
                <p className="mt-1 text-xs text-muted">
                  La tabla de amortización se calculará automáticamente.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <p className="text-xs text-muted">Cuota fija</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatMonto(resumen.montoCuota, moneda)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <p className="text-xs text-muted">Total intereses</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-300">
                      {formatMonto(resumen.totalInteres, moneda)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
                    <p className="text-xs text-muted">Total a pagar</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                      {formatMonto(resumen.totalPagar, moneda)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-border">
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
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Barra de acciones de ancho completo: los 3 botones quedan alineados */}
      <div className="sticky bottom-0 z-20 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <Button
          as="link"
          to={isEditing ? `/cotizaciones/${editingId}` : '/cotizaciones'}
          variant="ghost"
        >
          Cancelar
        </Button>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              iconLeft={<CheckCircle2 className="h-4 w-4" />}
              loading={submitting}
              onClick={handleSubmit((v) => onSubmit(v, true))}
            >
              Guardar y Aprobar
            </Button>
          )}
          <Button
            type="submit"
            form="formulario-cotizacion"
            iconLeft={<Save className="h-4 w-4" />}
            loading={submitting}
          >
            {isEditing ? 'Guardar Cambios' : 'Guardar Cotización'}
          </Button>
        </div>
      </div>
    </div>
  )
}
