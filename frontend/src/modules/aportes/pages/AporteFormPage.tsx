import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, ArrowLeft } from 'lucide-react'
import { useAporte, useCreateAporte, useUpdateAporte } from '../hooks/useAportes'
import { aporteFormSchema, type AporteFormValues } from '../schemas/aporteSchema'
import {
  Button,
  SectionHeader,
  Card,
  FormField,
  Input,
  Textarea,
  Select,
  LoadingSpinner,
} from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { AporteFormData } from '../types'

const toLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function AporteFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const { data: aporteData, isLoading: loadingAporte } = useAporte(Number(id))

  const createMutation = useCreateAporte()
  const updateMutation = useUpdateAporte(Number(id))

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AporteFormValues>({
    resolver: zodResolver(aporteFormSchema),
    defaultValues: {
      tipo: 'OBLIGATORIO',
      monto: '',
      periodo: new Date().toISOString().slice(0, 7),
      fechaAporte: toLocalDateString(new Date()),
      metodoPago: 'EFECTIVO',
      comprobante: '',
      observacion: '',
      fondoId: '',
      socioId: '',
    },
  })

  const { field: fondoField } = useController({ name: 'fondoId', control })
  const { field: socioField } = useController({ name: 'socioId', control })
  const fondoId = fondoField.value

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select', { estado: 'ACTIVO' }],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100, estado: 'ACTIVO' } })
      return data.data as { id: number; nombre: string; moneda: string }[]
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
    if (aporteData?.data && isEdit) {
      const a = aporteData.data
      reset({
        tipo: a.tipo,
        monto: String(a.monto),
        periodo: a.periodo,
        fechaAporte: a.fechaAporte?.slice(0, 10) || toLocalDateString(new Date()),
        metodoPago: a.metodoPago,
        comprobante: a.comprobante || '',
        observacion: a.observacion || '',
        fondoId: String(a.fondoId),
        socioId: String(a.socioId),
      })
    }
  }, [aporteData, isEdit, reset])

  const onSubmit = (values: AporteFormValues) => {
    const payload: AporteFormData = {
      tipo: values.tipo,
      monto: Number(values.monto),
      periodo: values.periodo,
      fechaAporte: values.fechaAporte || undefined,
      metodoPago: values.metodoPago,
      comprobante: values.comprobante || undefined,
      observacion: values.observacion || undefined,
      fondoId: Number(values.fondoId),
      socioId: Number(values.socioId),
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isEdit && loadingAporte) {
    return <LoadingSpinner text="Cargando aporte..." />
  }

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
          title={isEdit ? 'Editar Aporte' : 'Nuevo Aporte'}
          description={isEdit ? 'Modificar datos del aporte' : 'Registrar un nuevo aporte'}
        />
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Tipo de Aporte" required error={errors.tipo?.message}>
              <Select
                {...register('tipo')}
                error={errors.tipo?.message}
                options={[
                  { value: 'OBLIGATORIO', label: 'Obligatorio' },
                  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
                  { value: 'VOLUNTARIO', label: 'Voluntario' },
                  { value: 'MULTA', label: 'Multa' },
                ]}
              />
            </FormField>

            <FormField label="Monto" required error={errors.monto?.message}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('monto')}
                error={errors.monto?.message}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Fondo Rotatorio" required error={errors.fondoId?.message}>
              <Select
                value={fondoField.value || ''}
                onChange={(e) => {
                  fondoField.onChange(e.target.value)
                  socioField.onChange('')
                }}
                error={errors.fondoId?.message}
                options={(fondosData || []).map((f) => ({
                  value: String(f.id),
                  label: `${f.nombre} (${f.moneda})`,
                }))}
                placeholder="Seleccione un fondo"
              />
            </FormField>

            <FormField label="Socio" required error={errors.socioId?.message}>
              <Select
                value={socioField.value || ''}
                onChange={(e) => socioField.onChange(e.target.value)}
                error={errors.socioId?.message}
                options={(sociosData || []).map((s) => ({
                  value: String(s.id),
                  label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
                }))}
                placeholder={fondoId ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
                disabled={!fondoId}
              />
            </FormField>

            <FormField label="Período" required error={errors.periodo?.message}>
              <Input type="month" {...register('periodo')} error={errors.periodo?.message} />
            </FormField>

            <FormField label="Fecha de Aporte" error={errors.fechaAporte?.message}>
              <Input type="date" {...register('fechaAporte')} error={errors.fechaAporte?.message} />
            </FormField>

            <FormField label="Método de Pago" error={errors.metodoPago?.message}>
              <Select
                {...register('metodoPago')}
                error={errors.metodoPago?.message}
                options={[
                  { value: 'EFECTIVO', label: 'Efectivo' },
                  { value: 'TRANSFERENCIA', label: 'Transferencia' },
                  { value: 'DEPOSITO', label: 'Depósito' },
                ]}
              />
            </FormField>

            <FormField label="N° Comprobante" error={errors.comprobante?.message}>
              <Input
                {...register('comprobante')}
                error={errors.comprobante?.message}
                placeholder="Número de operación"
              />
            </FormField>

            <FormField
              label="Observación"
              className="sm:col-span-2"
              error={errors.observacion?.message}
            >
              <Textarea
                {...register('observacion')}
                error={errors.observacion?.message}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </FormField>
          </div>

          <div className="sticky bottom-0 z-10 mt-2 flex items-center justify-end gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-xl">
            <Button as="link" to="/aportes" variant="ghost">
              Cancelar
            </Button>
            <Button
              type="submit"
              iconLeft={<Save className="h-4 w-4" />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? 'Guardar Cambios' : 'Registrar Aporte'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
