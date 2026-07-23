import { useState } from 'react'
import { ArrowLeft, Save, PiggyBank } from 'lucide-react'
import { useCrearCuentaAhorro } from '../hooks/useAhorros'
import { Button, SectionHeader, Card, FormField, Select } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function AhorroFormPage() {
  const createMutation = useCrearCuentaAhorro()

  const [selectedFondo, setSelectedFondo] = useState('')
  const [selectedSocio, setSelectedSocio] = useState('')

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select'],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100, estado: 'ACTIVO' } })
      return data.data as { id: number; nombre: string; moneda: string }[]
    },
  })

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
    if (!selectedFondo) { toast.error('Seleccione un fondo'); return }
    if (!selectedSocio) { toast.error('Seleccione un socio'); return }
    createMutation.mutate({
      fondoId: Number(selectedFondo),
      socioId: Number(selectedSocio),
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Nueva Cuenta de Ahorro"
          description="Crear cuenta de ahorro para un socio en un fondo"
        />
        <Button as="link" to="/ahorros" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-lg" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl bg-[#2563EB]/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827]">Cuenta de Ahorro</p>
              <p className="text-xs text-gray-500">El saldo inicial será S/ 0.00</p>
            </div>
          </div>

          <FormField label="Fondo Rotatorio" required>
            <Select
              value={selectedFondo}
              onChange={(e) => {
                setSelectedFondo(e.target.value)
                setSelectedSocio('')
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
              value={selectedSocio}
              onChange={(e) => setSelectedSocio(e.target.value)}
              options={(sociosData || []).map((s) => ({
                value: String(s.id),
                label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
              }))}
              required
              placeholder={selectedFondo ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
              disabled={!selectedFondo}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button as="link" to="/ahorros" variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" iconLeft={<Save className="h-4 w-4" />} disabled={createMutation.isPending || !selectedFondo || !selectedSocio}>
              Crear Cuenta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
