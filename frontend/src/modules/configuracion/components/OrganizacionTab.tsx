import { useEffect } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CheckCircle2, Info, Mail, MapPin, Phone, RotateCcw, Save } from 'lucide-react'
import { Button, Card, ErrorState, FormField, Input, LoadingSpinner, Select } from '@/components/ui'
import { organizacionFormSchema, type OrganizacionFormValues } from '../schemas/configuracionSchema'
import { useOrganizacion, useUpdateOrganizacion } from '../hooks/useConfiguracion'
import type { Organizacion } from '../types'
import { OPCIONES_MONEDA } from './comunes'

const VALORES_INICIALES: OrganizacionFormValues = {
  organizacion: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
  monedaDefault: 'PEN',
}

function valoresDesde(organizacion: Organizacion): OrganizacionFormValues {
  return {
    organizacion: organizacion.organizacion || '',
    ruc: organizacion.ruc || '',
    direccion: organizacion.direccion || '',
    telefono: organizacion.telefono || '',
    email: organizacion.email || '',
    monedaDefault: organizacion.monedaDefault === 'USD' ? 'USD' : 'PEN',
  }
}

interface OrganizacionTabProps {
  onDirtyChange?: (hayCambios: boolean) => void
}

export default function OrganizacionTab({ onDirtyChange }: OrganizacionTabProps) {
  const { data: organizacion, isLoading, isError, error, refetch } = useOrganizacion()
  const updateMutation = useUpdateOrganizacion()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<OrganizacionFormValues>({
    resolver: zodResolver(organizacionFormSchema),
    defaultValues: VALORES_INICIALES,
  })

  const { field: monedaField } = useController({ control, name: 'monedaDefault' })

  useEffect(() => {
    if (!organizacion || isDirty) return
    reset(valoresDesde(organizacion))
  }, [organizacion, isDirty, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
    return () => onDirtyChange?.(false)
  }, [isDirty, onDirtyChange])

  const enviar = async (valores: OrganizacionFormValues) => {
    try {
      const respuesta = await updateMutation.mutateAsync({
        organizacion: valores.organizacion.trim(),
        ruc: valores.ruc?.trim() || '',
        direccion: valores.direccion?.trim() || '',
        telefono: valores.telefono?.trim() || '',
        email: valores.email?.trim() || '',
        monedaDefault: valores.monedaDefault,
      })
      const actualizada = respuesta?.data as Organizacion | undefined
      if (actualizada) reset(valoresDesde(actualizada))
    } catch {
      // El hook de mutación ya muestra el mensaje de error.
    }
  }

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner text="Cargando organización..." />
      </div>
    )

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Datos de la organización</h3>
              <p className="text-sm text-muted">
                Información institucional que se muestra en el sistema.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              label="Nombre de la organización"
              required
              error={errors.organizacion?.message}
              description="Se muestra en la aplicación y en los documentos institucionales."
            >
              <Input
                placeholder="Ej: Banquito Solidario"
                error={errors.organizacion?.message}
                {...register('organizacion')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="RUC"
                error={errors.ruc?.message}
                description="11 dígitos, sin espacios."
              >
                <Input
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="20123456789"
                  error={errors.ruc?.message}
                  {...register('ruc')}
                />
              </FormField>

              <FormField
                label="Teléfono"
                error={errors.telefono?.message}
                description="Teléfono de contacto institucional."
              >
                <Input
                  autoComplete="tel"
                  placeholder="999 999 999"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
              </FormField>
            </div>

            <FormField label="Correo electrónico" error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="contacto@organizacion.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </FormField>

            <FormField label="Dirección" error={errors.direccion?.message}>
              <Input
                autoComplete="street-address"
                placeholder="Av. Principal 123, ciudad"
                error={errors.direccion?.message}
                {...register('direccion')}
              />
            </FormField>

            <FormField
              label="Moneda por defecto"
              error={errors.monedaDefault?.message}
              description="Valor inicial para nuevos fondos y cajas. No convierte saldos existentes."
            >
              <Select
                options={OPCIONES_MONEDA}
                value={monedaField.value}
                onChange={monedaField.onChange}
              />
            </FormField>
          </div>
        </Card>

        <Card padding="lg" className="h-fit">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">Qué cambia y qué no</h3>
          </div>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
              Los datos se guardan como configuración institucional única.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
              Los cambios quedan registrados en la auditoría del sistema.
            </li>
            <li className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
              No se modifican los nombres ni las monedas de los fondos ya creados.
            </li>
            <li className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
              La moneda por defecto no convierte saldos ni movimientos existentes.
            </li>
          </ul>

          <div className="mt-5 space-y-2 rounded-xl bg-surface-muted/60 p-3 text-xs text-subtle">
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {organizacion?.telefono || 'Sin teléfono registrado'}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {organizacion?.email || 'Sin correo registrado'}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {organizacion?.direccion || 'Sin dirección registrada'}
            </p>
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted" role="status">
          {isDirty ? 'Tienes cambios sin guardar.' : 'No hay cambios pendientes.'}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset()}
            disabled={!isDirty || updateMutation.isPending}
            iconLeft={<RotateCcw className="h-4 w-4" />}
          >
            Descartar
          </Button>
          <Button
            type="submit"
            loading={updateMutation.isPending}
            disabled={!isDirty}
            iconLeft={<Save className="h-4 w-4" />}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  )
}
