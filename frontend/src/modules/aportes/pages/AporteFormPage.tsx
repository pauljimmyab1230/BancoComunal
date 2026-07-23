import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { useAporte, useCreateAporte, useUpdateAporte } from '../hooks/useAportes'
import { Button, SectionHeader, Card, FormField, Input, Select, LoadingSpinner } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { AporteFormData, TipoAporte, MetodoPago } from '../types'

export default function AporteFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const { data: aporteData, isLoading: loadingAporte } = useAporte(Number(id))

  const createMutation = useCreateAporte()
  const updateMutation = useUpdateAporte(Number(id))

  const [form, setForm] = useState<AporteFormData>({
    tipo: 'OBLIGATORIO',
    monto: 0,
    periodo: new Date().toISOString().slice(0, 7),
    fechaAporte: new Date().toISOString().slice(0, 10),
    metodoPago: 'EFECTIVO',
    comprobante: '',
    observacion: '',
    fondoId: 0,
    socioId: 0,
  })

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select'],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100, estado: 'ACTIVO' } })
      return data.data as { id: number; nombre: string; moneda: string }[]
    },
  })

  const [selectedFondo, setSelectedFondo] = useState<string>('')

  const { data: sociosData } = useQuery({
    queryKey: ['socios-por-fondo', selectedFondo],
    queryFn: async () => {
      if (!selectedFondo) return []
      const { data } = await api.get(`/fondos/${selectedFondo}/socios`)
      return (data.data || []).map((fs: any) => fs.socio) as { id: number; codigo: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string }[]
    },
    enabled: !!selectedFondo,
  })

  useEffect(() => {
    if (aporteData?.data) {
      const a = aporteData.data
      setForm({
        tipo: a.tipo,
        monto: a.monto,
        periodo: a.periodo,
        fechaAporte: a.fechaAporte?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        metodoPago: a.metodoPago,
        comprobante: a.comprobante || '',
        observacion: a.observacion || '',
        fondoId: a.fondoId,
        socioId: a.socioId,
      })
      setSelectedFondo(String(a.fondoId))
    }
  }, [aporteData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.fondoId) { toast.error('Seleccione un fondo'); return }
    if (!form.socioId) { toast.error('Seleccione un socio'); return }
    if (!form.monto || form.monto <= 0) { toast.error('Ingrese un monto válido'); return }
    if (!form.periodo) { toast.error('Ingrese el período'); return }

    if (isEdit) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const update = (field: keyof AporteFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (isEdit && loadingAporte) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title={isEdit ? 'Editar Aporte' : 'Nuevo Aporte'}
          description={isEdit ? 'Modificar datos del aporte' : 'Registrar un nuevo aporte'}
        />
        <Button as="link" to="/aportes" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Tipo de Aporte" required>
              <Select
                value={form.tipo}
                onChange={(e) => update('tipo', e.target.value as TipoAporte)}
                options={[
                  { value: 'OBLIGATORIO', label: 'Obligatorio' },
                  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
                  { value: 'VOLUNTARIO', label: 'Voluntario' },
                ]}
                required
              />
            </FormField>

            <FormField label="Monto" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.monto || ''}
                onChange={(e) => update('monto', Number(e.target.value))}
                placeholder="0.00"
                required
              />
            </FormField>

            <FormField label="Fondo Rotatorio" required>
              <Select
                value={selectedFondo}
                onChange={(e) => {
                  setSelectedFondo(e.target.value)
                  update('fondoId', Number(e.target.value))
                  update('socioId', 0)
                }}
                options={(fondosData || []).map((f) => ({
                  value: String(f.id),
                  label: `${f.nombre} (${f.moneda})`,
                }))}
                required
                placeholder="Seleccione un fondo"
              />
            </FormField>

            <FormField label="Socio" required>
              <Select
                value={String(form.socioId || '')}
                onChange={(e) => update('socioId', Number(e.target.value))}
                options={(sociosData || []).map((s) => ({
                  value: String(s.id),
                  label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
                }))}
                required
                placeholder={selectedFondo ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
                disabled={!selectedFondo}
              />
            </FormField>

            <FormField label="Período" required>
              <Input
                type="month"
                value={form.periodo}
                onChange={(e) => update('periodo', e.target.value)}
                required
              />
            </FormField>

            <FormField label="Fecha de Aporte">
              <Input
                type="date"
                value={form.fechaAporte || ''}
                onChange={(e) => update('fechaAporte', e.target.value)}
              />
            </FormField>

            <FormField label="Método de Pago">
              <Select
                value={form.metodoPago}
                onChange={(e) => update('metodoPago', e.target.value as MetodoPago)}
                options={[
                  { value: 'EFECTIVO', label: 'Efectivo' },
                  { value: 'TRANSFERENCIA', label: 'Transferencia' },
                  { value: 'DEPOSITO', label: 'Depósito' },
                ]}
              />
            </FormField>

            <FormField label="N° Comprobante">
              <Input
                value={form.comprobante || ''}
                onChange={(e) => update('comprobante', e.target.value)}
                placeholder="Número de operación"
              />
            </FormField>

            <FormField label="Observación" className="sm:col-span-2">
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-gray-400"
                value={form.observacion || ''}
                onChange={(e) => update('observacion', e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button as="link" to="/aportes" variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" iconLeft={<Save className="h-4 w-4" />} disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? 'Guardar Cambios' : 'Registrar Aporte'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
