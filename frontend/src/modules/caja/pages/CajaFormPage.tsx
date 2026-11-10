import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCaja, useCreateCaja, useUpdateCaja } from '../hooks/useCajas'
import { cajaCreateSchema, type CajaCreateInput } from '../validations'
import { useFondos } from '@/modules/fondos/hooks/useFondos'
import type { FondoRotatorio } from '@/modules/fondos/types'
import { ArrowLeft } from 'lucide-react'
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SectionHeader,
  LoadingSpinner,
} from '@/components/ui'

const tipoOptions = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'SECUNDARIA', label: 'Secundaria' },
  { value: 'CAJA_CHICA', label: 'Caja Chica' },
]

const monedaOptions = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

export default function CajaFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: caja, isLoading: loadingCaja } = useCaja(Number(id))
  const { data: fondosData, isLoading: loadingFondos } = useFondos({ limit: 100 })

  const fondoOptions = (fondosData?.data || []).map((f: FondoRotatorio) => ({
    value: String(f.id),
    label: f.nombre,
  }))

  const createCaja = useCreateCaja()
  const updateCaja = useUpdateCaja(Number(id))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof cajaCreateSchema>, unknown, z.output<typeof cajaCreateSchema>>({
    resolver: zodResolver(cajaCreateSchema),
    defaultValues: {
      nombre: '',
      tipo: 'PRINCIPAL',
      saldoInicial: 0,
      moneda: 'PEN',
      fondoId: 0,
    },
  })

  useEffect(() => {
    if (caja) {
      reset({
        nombre: caja.nombre,
        tipo: caja.tipo,
        saldoInicial: caja.saldoInicial,
        moneda: caja.moneda as 'PEN' | 'USD',
        fondoId: caja.fondoId,
      })
    }
  }, [caja, reset])

  const onSubmit = (data: CajaCreateInput) => {
    if (isEdit) {
      updateCaja.mutate(data)
    } else {
      createCaja.mutate(data)
    }
  }

  if (isEdit && loadingCaja) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando caja..." />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
        <SectionHeader
          title={isEdit ? 'Editar Caja' : 'Nueva Caja'}
          description={
            isEdit ? 'Actualiza los datos de la caja' : 'Registra una nueva caja en el sistema'
          }
        />
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Nombre" error={errors.nombre?.message}>
              <Input {...register('nombre')} placeholder="Nombre de la caja" />
            </FormField>

            <FormField label="Tipo" error={errors.tipo?.message}>
              <Select options={tipoOptions} {...register('tipo')} />
            </FormField>

            <FormField label="Saldo Inicial" error={errors.saldoInicial?.message}>
              <Input
                type="number"
                step="0.01"
                {...register('saldoInicial', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Moneda" error={errors.moneda?.message}>
              <Select options={monedaOptions} {...register('moneda')} />
            </FormField>

            <FormField label="Fondo" error={errors.fondoId?.message}>
              <Select
                options={fondoOptions}
                placeholder={loadingFondos ? 'Cargando fondos...' : 'Seleccionar fondo'}
                {...register('fondoId', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createCaja.isPending || updateCaja.isPending}
            >
              {isEdit ? 'Actualizar' : 'Crear Caja'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
