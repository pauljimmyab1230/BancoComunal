import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, ArrowLeft, Banknote } from 'lucide-react'
import { useCrearCredito, useActualizarCredito, useCredito } from '../hooks/useCreditos'
import { Button, SectionHeader, Card, FormField, Input, Select, LoadingSpinner } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/lib/api'

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

interface FondoOption {
  id: number
  nombre: string
  moneda: string
  capitalDisponible: number
}

export default function CreditoFormPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const isEditing = editingId !== null

  const createMutation = useCrearCredito()
  const updateMutation = useActualizarCredito(editingId || 0)
  const { data: prestamoData, isLoading: loadingPrestamo } = useCredito(editingId || 0)

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
      return data.data as FondoOption[]
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

  useEffect(() => {
    if (isEditing && prestamoData?.data) {
      const p = prestamoData.data
      setForm({
        monto: String(p.monto),
        tasaInteres: String(p.tasaInteres),
        numeroCuotas: String(p.numeroCuotas),
        fechaPrimerVencimiento: p.fechaPrimerVencimiento.slice(0, 10),
        fondoId: String(p.fondo.id),
        socioId: String(p.socio.id),
      })
      setSelectedFondo(String(p.fondo.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, prestamoData])

  const monedaFondo = (fondoId: string) => {
    const f = (fondosData || []).find((x) => String(x.id) === fondoId)
    return f?.moneda || 'PEN'
  }

  const fondoOptions = [
    ...(fondosData || []).map((f) => ({
      value: String(f.id),
      label: `${f.nombre} (${f.moneda}) - Disp: ${formatMonto(Number(f.capitalDisponible), f.moneda)}`,
    })),
  ]
  if (isEditing && prestamoData?.data && !fondosData?.some((f) => f.id === prestamoData.data.fondo.id)) {
    fondoOptions.unshift({
      value: String(prestamoData.data.fondo.id),
      label: `${prestamoData.data.fondo.nombre} (${prestamoData.data.fondo.moneda})`,
    })
  }

  const socioOptions = (sociosData || []).map((s) => ({
    value: String(s.id),
    label: `${s.codigo} - ${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`,
  }))
  if (isEditing && prestamoData?.data && !sociosData?.some((s) => s.id === prestamoData.data.socio.id)) {
    socioOptions.unshift({
      value: String(prestamoData.data.socio.id),
      label: `${prestamoData.data.socio.codigo} - ${prestamoData.data.socio.nombres} ${prestamoData.data.socio.apellidoPaterno} ${prestamoData.data.socio.apellidoMaterno}`,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monto = Number(form.monto)
    if (!monto || monto <= 0) { toast.error('Ingrese un monto válido mayor a 0'); return }
    const tasa = Number(form.tasaInteres)
    if (isNaN(tasa) || tasa < 0) { toast.error('Ingrese una tasa de interés válida'); return }
    const cuotas = Number(form.numeroCuotas)
    if (!cuotas || cuotas < 1) { toast.error('Ingrese al menos 1 cuota'); return }
    if (!form.fechaPrimerVencimiento) { toast.error('Ingrese la fecha de primer vencimiento'); return }

    const payload = {
      monto,
      tasaInteres: tasa,
      numeroCuotas: cuotas,
      fechaPrimerVencimiento: form.fechaPrimerVencimiento,
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      if (!form.fondoId) { toast.error('Seleccione un fondo'); return }
      if (!form.socioId) { toast.error('Seleccione un socio'); return }
      createMutation.mutate({
        ...payload,
        fondoId: Number(form.fondoId),
        socioId: Number(form.socioId),
      })
    }
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (isEditing && loadingPrestamo) {
    return <LoadingSpinner />
  }

  const disabled = isEditing
  const submitting = isEditing ? updateMutation.isPending : createMutation.isPending

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title={isEditing ? 'Editar Crédito' : 'Nuevo Crédito'}
          description={isEditing ? 'Modificar las condiciones del préstamo' : 'Registrar un préstamo para un socio'}
        />
        <Button as="link" to={isEditing ? `/creditos/${editingId}` : '/creditos'} variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
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
              <p className="text-sm font-medium text-[#111827]">{isEditing ? 'Modificar Préstamo' : 'Nuevo Préstamo'}</p>
              <p className="text-xs text-gray-500">Sistema de amortización francesa (cuota fija). Solo se puede editar antes de pagar la primera cuota.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Fondo Rotatorio" required>
              <Select
                value={form.fondoId}
                onChange={(e) => {
                  setSelectedFondo(e.target.value)
                  update('fondoId', e.target.value)
                  update('socioId', '')
                }}
                options={fondoOptions}
                required
                disabled={disabled}
                placeholder="Seleccione un fondo"
              />
            </FormField>

            <FormField label="Socio" required>
              <Select
                value={form.socioId}
                onChange={(e) => update('socioId', e.target.value)}
                options={socioOptions}
                required
                placeholder={form.fondoId ? 'Seleccione un socio' : 'Primero seleccione un fondo'}
                disabled={disabled}
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

            <FormField label="Tasa de Interés (%) mensual" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
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
                max="60"
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

          {form.fondoId && form.monto && Number(form.monto) > 0 && Number(form.numeroCuotas) >= 1 && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm">
              <p className="font-medium text-emerald-800">Cuota estimada</p>
              <p className="text-emerald-700">
                ≈ {formatMonto(
                  (() => {
                    const i = Number(form.tasaInteres) / 100
                    const n = Number(form.numeroCuotas)
                    const m = Number(form.monto)
                    if (isNaN(i) || isNaN(n) || isNaN(m) || i < 0 || n < 1 || m <= 0) return 0
                    return i > 0 ? (m * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) : m / n
                  })(),
                  monedaFondo(form.fondoId),
                )} por cuota
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button as="link" to={isEditing ? `/creditos/${editingId}` : '/creditos'} variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" iconLeft={<Save className="h-4 w-4" />} loading={submitting} disabled={submitting}>
              {isEditing ? 'Guardar Cambios' : 'Crear Crédito'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
