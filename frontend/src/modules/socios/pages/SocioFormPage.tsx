import { useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, User } from 'lucide-react'
import { socioFormSchema, type SocioFormValues } from '../schemas/socioSchema'
import { useSocio, useCreateSocio, useUpdateSocio } from '../hooks/useSocios'
import { Button, Card, FormField, Input, Select, ImageUpload, SectionHeader, LoadingSpinner } from '@/components/ui'

const generoOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

const estadoCivilOptions = [
  { value: 'S', label: 'Soltero' },
  { value: 'C', label: 'Casado' },
  { value: 'V', label: 'Viudo' },
  { value: 'D', label: 'Divorciado' },
]

const estadoOptions = [
  { value: 'A', label: 'Activo' },
  { value: 'I', label: 'Inactivo' },
]

export default function SocioFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()

  const { data: socioData, isLoading: loadingSocio } = useSocio(Number(id))
  const createMutation = useCreateSocio()
  const updateMutation = useUpdateSocio(Number(id))

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SocioFormValues>({
    resolver: zodResolver(socioFormSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      genero: 'M',
      fechaNacimiento: '',
      estadoCivil: 'S',
      telefono: '',
      direccion: '',
      email: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'A',
    },
  })

  const { field: fotoField } = useController({ name: 'foto' as any, control })
  const handleFotoChange = useCallback((file: File | null) => {
    fotoField.onChange(file)
  }, [fotoField])

  useEffect(() => {
    if (socioData?.data && isEditing) {
      const socio = socioData.data
      reset({
        dni: socio.dni,
        nombres: socio.nombres,
        apellidoPaterno: socio.apellidoPaterno,
        apellidoMaterno: socio.apellidoMaterno,
        genero: socio.genero as 'M' | 'F',
        fechaNacimiento: socio.fechaNacimiento?.split('T')[0] || '',
        estadoCivil: (socio.estadoCivil || 'S') as 'S' | 'C' | 'V' | 'D',
        telefono: socio.telefono || '',
        direccion: socio.direccion || '',
        email: socio.email || '',
        fechaIngreso: socio.fechaIngreso.split('T')[0],
        estado: socio.estado as 'A' | 'I',
      })
    }
  }, [socioData, isEditing, reset])

  const onSubmit = async (values: SocioFormValues) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'foto') {
        if (value instanceof File) {
          formData.append('foto', value)
        }
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  if (isEditing && loadingSocio) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando datos del socio..." />
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
          title={isEditing ? 'Editar Socio' : 'Nuevo Socio'}
          description={isEditing ? 'Actualiza los datos del socio' : 'Registra un nuevo socio en la organización'}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Datos Personales</h3>
              <p className="text-xs text-gray-500">Información principal del socio</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="DNI" required error={errors.dni?.message}>
              <Input {...register('dni')} placeholder="12345678" maxLength={8} error={errors.dni?.message} />
            </FormField>

            <FormField label="Fecha de Ingreso" required error={errors.fechaIngreso?.message}>
              <Input type="date" {...register('fechaIngreso')} error={errors.fechaIngreso?.message} />
            </FormField>

            <FormField label="Estado" required error={errors.estado?.message}>
              <Select {...register('estado')} options={estadoOptions} error={errors.estado?.message} />
            </FormField>

            <FormField label="Nombres" required error={errors.nombres?.message}>
              <Input {...register('nombres')} placeholder="Nombres" error={errors.nombres?.message} />
            </FormField>

            <FormField label="Apellido Paterno" required error={errors.apellidoPaterno?.message}>
              <Input {...register('apellidoPaterno')} placeholder="Apellido paterno" error={errors.apellidoPaterno?.message} />
            </FormField>

            <FormField label="Apellido Materno" required error={errors.apellidoMaterno?.message}>
              <Input {...register('apellidoMaterno')} placeholder="Apellido materno" error={errors.apellidoMaterno?.message} />
            </FormField>

            <FormField label="Género" required error={errors.genero?.message}>
              <Select {...register('genero')} options={generoOptions} error={errors.genero?.message} />
            </FormField>

            <FormField label="Fecha de Nacimiento" required error={errors.fechaNacimiento?.message}>
              <Input type="date" {...register('fechaNacimiento')} error={errors.fechaNacimiento?.message} />
            </FormField>

            <FormField label="Estado Civil" required error={errors.estadoCivil?.message}>
              <Select {...register('estadoCivil')} options={estadoCivilOptions} error={errors.estadoCivil?.message} />
            </FormField>
          </div>
        </Card>

        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Contacto</h3>
              <p className="text-xs text-gray-500">Información de contacto del socio</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Teléfono" error={errors.telefono?.message}>
              <Input {...register('telefono')} placeholder="987654321" maxLength={9} error={errors.telefono?.message} />
            </FormField>

            <FormField label="Correo Electrónico" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="correo@ejemplo.com" error={errors.email?.message} />
            </FormField>

            <FormField label="Dirección" error={errors.direccion?.message} className="sm:col-span-2 lg:col-span-1">
              <Input {...register('direccion')} placeholder="Dirección completa" error={errors.direccion?.message} />
            </FormField>
          </div>
        </Card>

        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Fotografía</h3>
              <p className="text-xs text-gray-500">Foto del socio para identificación</p>
            </div>
          </div>

          <ImageUpload
            onChange={(file) => {
              handleFotoChange(file)
            }}
            className="max-w-sm"
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/socios')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending} iconLeft={<Save className="h-4 w-4" />}>
            {isEditing ? 'Guardar Cambios' : 'Registrar Socio'}
          </Button>
        </div>
      </form>
    </div>
  )
}
