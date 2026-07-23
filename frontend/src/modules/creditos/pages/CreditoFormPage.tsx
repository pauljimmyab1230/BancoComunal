import { useState } from 'react'
import { Save, ArrowLeft, Banknote } from 'lucide-react'
import { useCrearCredito } from '../hooks/useCreditos'
import { Button, SectionHeader, Card, FormField, Input, Select } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function CreditoFormPage() {
  const createMutation = useCrearCredito()

  const [form, setForm] = useState({
    monto: '',
    tasaInteres: '',
    numeroCuotas: '',
    fechaPrimerVencimiento: '',
    fondoId: '',
    socioId: '',
  })

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select'],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100, estado: 'ACTIVO' } })
      return data.data as { id: number; nombre: string; moneda: string; capitalDisponible: number }[]
    },
  })

  const [selectedFondo, setSelectedFondo] = useState('')

  const { data: sociosData } = useQuery({
    queryKey: ['socios-por-fondo', selectedFondo],
    queryFn: async () => {
      if (!selectedFondo) return []
      const { data } = await api.get(`/fondos/${selectedFondo}/socios`)
      return (data.data || []).map((fs: any) => fs.socio) as { id: number; codigo: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string }[]
    },
    enabled: !!selectedFondo,
  })


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fondoId) { toast.error('Seleccione un fondo'); return }
    if (!form.socioId) { toast.error('Seleccione un socio'); return }
    const monto = Number(form.monto)
    if (!monto || monto <= 0) { toast.error('Ingrese un monto válido mayor a 0'); return }
    const tasa = Number(form.tasaInteres)
    if (isNaN(tasa) || tasa < 0) { toast.error('Ingrese una tasa de interés válida'); return }
    const cuotas = Number(form.numeroCuotas)
    if (!cuotas || cuotas < 1) { toast.error('Ingrese al menos 1 cuota'); return }
    if (!form.fechaPrimerVencimiento) { toast.error('Ingrese la fecha de primer vencimiento'); return }

    createMutation.mutate({
      monto,
      tasaInteres: tasa,
      numeroCuotas: cuotas,
      fechaPrimerVencimiento: form.fechaPrimerVencimiento,
      fondoId: Number(form.fondoId),
      socioId: Number(form.socioId),
    })
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Nuevo Crédito"
          description="Registrar un préstamo para un socio"
        />
        <Button as="link" to="/creditos" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl bg-[#2563EB]/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827]">Nuevo Préstamo</p>
              <p className="text-xs text-gray-500">Sistema de amortización francesa (cuota fija)</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Fondo Rotatorio" required>
              <Select
                value={selectedFondo}
                onChange={(e) => {
                  setSelectedFondo(e.target.value)
                  update('fondoId', e.target.value)
                  update('socioId', '')
                }}
                options={(fondosData || []).map((f) => ({
                  value: String(f.id),
                  label: `${f.nombre} (${f.moneda}) - Disp: S/ ${Number(f.capitalDisponible).toFixed(2)}`,
                }))}
                required
                placeholder="Seleccione un fondo"
              />
            </FormField>

            <FormField label="Socio" required>
              <Select
                value={form.socioId}
                onChange={(e) => update('socioId', e.target.value)}
                options={(sociosData || []).map((s) => ({
                  value: String(s.id),
                  label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
                }))}
                required
                placeholder={selectedFondo ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
                disabled={!selectedFondo}
              />
            </FormField>

            <FormField label="Monto del Préstamo" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.monto}
                onChange={(e) => update('monto', e.target.value)}
                placeholder="0.00"
                required
              />
            </FormField>

            <FormField label="Tasa de Interés (%)" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.tasaInteres}
                onChange={(e) => update('tasaInteres', e.target.value)}
                placeholder="Ej: 2.5"
                required
              />
            </FormField>

            <FormField label="N° de Cuotas" required>
              <Input
                type="number"
                min="1"
                value={form.numeroCuotas}
                onChange={(e) => update('numeroCuotas', e.target.value)}
                placeholder="Ej: 6"
                required
              />
            </FormField>

            <FormField label="Primer Vencimiento" required>
              <Input
                type="date"
                value={form.fechaPrimerVencimiento}
                onChange={(e) => update('fechaPrimerVencimiento', e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button as="link" to="/creditos" variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" iconLeft={<Save className="h-4 w-4" />} disabled={createMutation.isPending}>
              Crear Crédito
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
