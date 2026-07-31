import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import { useFondo, useCreateFondo, useUpdateFondo } from '../hooks/useFondos'
import { Button, Card, FormField, Input, Select, SectionHeader, LoadingSpinner } from '@/components/ui'

const fondoSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  organizacion: z.string().max(200).optional().or(z.literal('')),
  capitalInicial: z.string().min(1, 'Requerido'),
  moneda: z.enum(['PEN', 'USD']),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CERRADO']),
  descripcion: z.string().optional().or(z.literal('')),
  reglamento: z.string().optional().or(z.literal('')),
  condiciones: z.string().optional().or(z.literal('')),
})

type FondoFormValues = z.infer<typeof fondoSchema>

export default function FondoFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()

  const { data: fondoData, isLoading: loadingFondo } = useFondo(Number(id))
  const createMutation = useCreateFondo()
  const updateMutation = useUpdateFondo(Number(id))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FondoFormValues>({
    resolver: zodResolver(fondoSchema),
    defaultValues: {
      nombre: '',
      organizacion: '',
      capitalInicial: '',
      moneda: 'PEN',
      estado: 'ACTIVO',
      descripcion: '',
      reglamento: '',
      condiciones: '',
    },
  })

  useEffect(() => {
    if (fondoData?.data && isEditing) {
      const f = fondoData.data
      reset({
        nombre: f.nombre,
        organizacion: f.organizacion || '',
        capitalInicial: String(f.capitalInicial),
        moneda: f.moneda as 'PEN' | 'USD',
        estado: f.estado as 'ACTIVO' | 'INACTIVO' | 'CERRADO',
        descripcion: f.descripcion || '',
        reglamento: f.reglamento || '',
        condiciones: f.condiciones || '',
      })
    }
  }, [fondoData, isEditing, reset])

  const onSubmit = (values: FondoFormValues) => {
    const payload = {
      ...values,
      capitalInicial: parseFloat(values.capitalInicial),
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isEditing && loadingFondo) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando datos del fondo..." />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
        <SectionHeader
          title={isEditing ? 'Editar Fondo' : 'Nuevo Fondo Rotatorio'}
          description={isEditing ? 'Actualiza los datos del fondo' : 'Crea un nuevo fondo rotatorio'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Información del Fondo</h3>
              <p className="text-xs text-gray-500">Datos generales del fondo rotatorio</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Nombre del Fondo" required error={errors.nombre?.message} className="sm:col-span-2">
              <Input {...register('nombre')} placeholder="Ej: Fondo Rotatorio Comunal 2026" error={errors.nombre?.message} />
            </FormField>

            <FormField label="Estado" required error={errors.estado?.message}>
              <Select {...register('estado')} options={[
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'INACTIVO', label: 'Inactivo' },
                { value: 'CERRADO', label: 'Cerrado' },
              ]} error={errors.estado?.message} />
            </FormField>

            <FormField label="Organización" error={errors.organizacion?.message}>
              <Input {...register('organizacion')} placeholder="Nombre de la organización" error={errors.organizacion?.message} />
            </FormField>

            <FormField label="Moneda" required error={errors.moneda?.message}>
              <Select {...register('moneda')} options={[
                { value: 'PEN', label: 'Soles (PEN)' },
                { value: 'USD', label: 'Dólares (USD)' },
              ]} error={errors.moneda?.message} />
            </FormField>

            <FormField label="Capital Inicial" required error={errors.capitalInicial?.message}>
              <Input
                {...register('capitalInicial')}
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.capitalInicial?.message}
              />
            </FormField>

            <FormField label="Descripción" error={errors.descripcion?.message} className="sm:col-span-2">
              <textarea
                {...register('descripcion')}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
                placeholder="Descripción del propósito del fondo..."
              />
            </FormField>

            <FormField label="Reglamento" error={errors.reglamento?.message} className="sm:col-span-3">
              <textarea
                {...register('reglamento')}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
                placeholder="Reglamento del fondo..."
              />
            </FormField>

            <FormField label="Condiciones" error={errors.condiciones?.message} className="sm:col-span-3">
              <textarea
                {...register('condiciones')}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none"
                placeholder="Condiciones del fondo..."
              />
            </FormField>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/fondos')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
            iconLeft={<Save className="h-4 w-4" />}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Fondo'}
          </Button>
        </div>
      </form>
    </div>
  )
}
