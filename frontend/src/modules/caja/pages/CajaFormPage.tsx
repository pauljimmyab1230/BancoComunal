import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useController, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Coins,
} from 'lucide-react'
import { useCaja, useCreateCaja, useUpdateCaja } from '../hooks/useCajas'
import { cajaFormSchema, type CajaFormValues, type CajaCreateInput } from '../validations'
import { useFondos } from '@/modules/fondos/hooks/useFondos'
import type { FondoRotatorio } from '@/modules/fondos/types'
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
  SectionHeader,
  LoadingSpinner,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

const tipoOptions = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'SECUNDARIA', label: 'Secundaria' },
  { value: 'CAJA_CHICA', label: 'Caja Chica' },
]

const monedaOptions = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

const estadoOptions = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'INACTIVA', label: 'Inactiva' },
  { value: 'CERRADA', label: 'Cerrada' },
]

const tipoEtiqueta: Record<string, string> = {
  PRINCIPAL: 'Caja principal',
  SECUNDARIA: 'Caja secundaria',
  CAJA_CHICA: 'Caja chica',
}

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

export default function CajaFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editingId = id ? Number(id) : null
  const isEditing = editingId !== null && !isNaN(editingId)

  const { data: caja, isLoading: loadingCaja } = useCaja(editingId || 0)
  const { data: fondosData, isLoading: loadingFondos } = useFondos({ limit: 100 })
  const createCaja = useCreateCaja()
  const updateCaja = useUpdateCaja(editingId || 0)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CajaFormValues>({
    resolver: zodResolver(cajaFormSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipo: 'PRINCIPAL',
      moneda: 'PEN',
      saldoInicial: '0',
      fondoId: '',
      estado: 'ACTIVA',
    },
  })

  // Los Select se controlan para que el reset de edición refresque la etiqueta visible.
  const { field: tipoField } = useController({ name: 'tipo', control })
  const { field: monedaField } = useController({ name: 'moneda', control })
  const { field: estadoField } = useController({ name: 'estado', control })
  const { field: fondoField } = useController({ name: 'fondoId', control })

  const fondos = (fondosData?.data || []) as FondoRotatorio[]
  const fondoOptions = fondos.map((fondo) => ({
    value: String(fondo.id),
    label: `${fondo.nombre} (${fondo.moneda})`,
  }))
  if (isEditing && caja?.fondo && !fondos.some((fondo) => fondo.id === caja.fondo?.id)) {
    fondoOptions.unshift({
      value: String(caja.fondo.id),
      label: `${caja.fondo.nombre} (${caja.moneda})`,
    })
  }

  const watchFondoId = useWatch({ control, name: 'fondoId' })
  const watchMoneda = useWatch({ control, name: 'moneda' })
  const watchTipo = useWatch({ control, name: 'tipo' })
  const watchSaldo = useWatch({ control, name: 'saldoInicial' })
  const watchNombre = useWatch({ control, name: 'nombre' })
  const watchEstado = useWatch({ control, name: 'estado' })

  const fondoSeleccionado = fondos.find((fondo) => String(fondo.id) === watchFondoId)
  const monedaFondo = fondoSeleccionado?.moneda
  const monedaCoincide = !monedaFondo || monedaFondo === watchMoneda
  const saldoNum = Number(watchSaldo)
  const saldoValido = !isNaN(saldoNum) && saldoNum >= 0
  const nombreValido = (watchNombre || '').trim().length >= 2

  useEffect(() => {
    if (isEditing && caja) {
      reset({
        nombre: caja.nombre,
        descripcion: caja.descripcion ?? '',
        tipo: caja.tipo,
        moneda: caja.moneda as 'PEN' | 'USD',
        saldoInicial: String(caja.saldoInicial),
        fondoId: String(caja.fondoId),
        estado: caja.estado,
      })
    }
  }, [isEditing, caja, reset])

  const onSubmit = (values: CajaFormValues) => {
    const payload: CajaCreateInput = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : undefined,
      tipo: values.tipo,
      moneda: values.moneda,
      saldoInicial: Number(values.saldoInicial),
      fondoId: Number(values.fondoId),
      estado: values.estado,
    }
    if (isEditing) updateCaja.mutate(payload)
    else createCaja.mutate(payload)
  }

  if (isEditing && loadingCaja) {
    return <LoadingSpinner text="Cargando caja..." />
  }

  const submitting = createCaja.isPending || updateCaja.isPending

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(isEditing ? `/caja/${editingId}` : '/caja')}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
        <SectionHeader
          title={isEditing ? 'Editar Caja' : 'Nueva Caja'}
          description={
            isEditing
              ? 'Actualiza los datos y el estado de la caja'
              : 'Registra una nueva caja asociada a un fondo rotatorio'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" padding="lg">
          <form id="formulario-caja" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl bg-secondary/5 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isEditing ? 'Datos de la caja' : 'Apertura de caja'}
                </p>
                <p className="text-xs text-muted">
                  Cada caja pertenece a un fondo y opera en su misma moneda. El código se genera
                  automáticamente.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                Identificación
              </p>

              <FormField label="Nombre de la caja" required error={errors.nombre?.message}>
                <Input
                  {...register('nombre')}
                  error={errors.nombre?.message}
                  placeholder="Ej: Caja Principal"
                />
              </FormField>

              <FormField label="Descripción" error={errors.descripcion?.message}>
                <Textarea
                  rows={3}
                  {...register('descripcion')}
                  error={errors.descripcion?.message}
                  placeholder="Uso o ubicación de la caja (opcional)"
                />
              </FormField>
            </div>

            <div className="space-y-4 border-t border-border-subtle pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                Configuración financiera
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Tipo de caja" required error={errors.tipo?.message}>
                  <Select
                    options={tipoOptions}
                    value={tipoField.value}
                    onChange={tipoField.onChange}
                  />
                </FormField>

                <FormField label="Moneda" required error={errors.moneda?.message}>
                  <Select
                    options={monedaOptions}
                    value={monedaField.value}
                    onChange={monedaField.onChange}
                  />
                  {monedaFondo && (
                    <p
                      className={`mt-1.5 text-xs ${
                        monedaCoincide
                          ? 'text-subtle'
                          : 'font-medium text-red-600 dark:text-red-400'
                      }`}
                    >
                      Moneda del fondo: {monedaFondo}
                      {!monedaCoincide && ' · debe coincidir con la caja'}
                    </p>
                  )}
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Saldo inicial" required error={errors.saldoInicial?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('saldoInicial')}
                    error={errors.saldoInicial?.message}
                    placeholder="0.00"
                  />
                </FormField>

                {isEditing && (
                  <FormField label="Estado" error={errors.estado?.message}>
                    <Select
                      options={estadoOptions}
                      value={estadoField.value}
                      onChange={estadoField.onChange}
                    />
                  </FormField>
                )}
              </div>

              {isEditing && (
                <p className="text-xs text-subtle">
                  Si cambias el saldo inicial, el saldo actual se ajusta por la diferencia. No se
                  puede cambiar la moneda ni el fondo si la caja ya tiene movimientos.
                </p>
              )}
            </div>

            <div className="space-y-4 border-t border-border-subtle pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                Fondo rotatorio <span className="font-normal normal-case">(obligatorio)</span>
              </p>

              <FormField label="Fondo" required error={errors.fondoId?.message}>
                <Select
                  value={fondoField.value}
                  onChange={(e) => {
                    fondoField.onChange(e)
                    const fondo = fondos.find((f) => String(f.id) === e.target.value)
                    if (fondo?.moneda) {
                      setValue('moneda', fondo.moneda as 'PEN' | 'USD', { shouldValidate: true })
                    }
                  }}
                  options={fondoOptions}
                  disabled={loadingFondos}
                  placeholder={loadingFondos ? 'Cargando fondos...' : 'Seleccione un fondo'}
                  error={errors.fondoId?.message}
                />
              </FormField>
            </div>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-semibold text-foreground">Resumen de la caja</h2>
            </div>

            <p className="text-xs uppercase tracking-wide text-subtle">Saldo inicial</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatCurrency(saldoValido ? saldoNum : 0, watchMoneda || 'PEN')}
            </p>

            <div className="mt-5 space-y-3 border-t border-border-subtle pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Nombre</span>
                <span className="truncate font-medium text-foreground">
                  {watchNombre?.trim() || 'Sin nombre'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Tipo</span>
                <span className="font-medium text-foreground">
                  {tipoEtiqueta[watchTipo] ?? watchTipo}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Estado</span>
                <span className="font-medium text-foreground">
                  {estadoOptions.find((e) => e.value === watchEstado)?.label ?? watchEstado}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Fondo</span>
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                  {fondoSeleccionado ? (
                    <>
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-subtle" />
                      <span className="truncate">{fondoSeleccionado.nombre}</span>
                    </>
                  ) : (
                    <span className="text-subtle">Sin asignar</span>
                  )}
                </span>
              </div>
            </div>
          </Card>

          <Card padding="lg" hover={false}>
            <h2 className="mb-3 text-base font-semibold text-foreground">Revisión rápida</h2>
            <ul className="space-y-2">
              <RevisionItem ok={nombreValido}>
                {nombreValido
                  ? 'Nombre de la caja válido'
                  : 'El nombre debe tener al menos 2 caracteres'}
              </RevisionItem>
              <RevisionItem ok={!!fondoSeleccionado}>
                {fondoSeleccionado
                  ? `Fondo asignado: ${fondoSeleccionado.nombre}`
                  : 'Selecciona el fondo rotatorio'}
              </RevisionItem>
              <RevisionItem ok={monedaCoincide}>
                {fondoSeleccionado
                  ? monedaCoincide
                    ? `Moneda coherente con el fondo (${monedaFondo})`
                    : `La moneda debe ser ${monedaFondo} como el fondo`
                  : 'La moneda se validará al elegir el fondo'}
              </RevisionItem>
              <RevisionItem ok={saldoValido}>
                {saldoValido
                  ? 'Saldo inicial válido'
                  : 'El saldo inicial debe ser un número mayor o igual a 0'}
              </RevisionItem>
            </ul>
          </Card>
        </div>
      </div>

      {/* Barra de acciones de ancho completo */}
      <div className="sticky bottom-0 z-20 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <Button as="link" to={isEditing ? `/caja/${editingId}` : '/caja'} variant="ghost">
          Cancelar
        </Button>

        <Button
          type="submit"
          form="formulario-caja"
          iconLeft={<Save className="h-4 w-4" />}
          loading={submitting}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Caja'}
        </Button>
      </div>
    </div>
  )
}
