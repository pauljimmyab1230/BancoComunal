import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Building2, Calendar, CheckCircle, DollarSign } from 'lucide-react'
import { useCredito, usePagarCuota } from '../hooks/useCreditos'
import { Button, SectionHeader, Card, Badge, LoadingSpinner, Modal, FormField, Input, Select } from '@/components/ui'
import toast from 'react-hot-toast'
import type { Prestamo, CuotaPrestamo } from '../types'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO': return <Badge variant="blue">Activo</Badge>
    case 'PAGADO': return <Badge variant="green">Pagado</Badge>
    case 'ANULADO': return <Badge variant="gray">Anulado</Badge>
    case 'PENDIENTE': return <Badge variant="yellow">Pendiente</Badge>
    default: return <Badge>{estado}</Badge>
  }
}

const cuotaEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'PAGADO': return <Badge variant="green">Pagado</Badge>
    case 'PENDIENTE': return <Badge variant="yellow">Pendiente</Badge>
    case 'VENCIDO': return <Badge variant="red">Vencido</Badge>
    case 'PARCIAL': return <Badge variant="blue">Parcial</Badge>
    case 'ANULADO': return <Badge variant="gray">Anulado</Badge>
    default: return <Badge>{estado}</Badge>
  }
}

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function CreditoDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useCredito(Number(id))
  const pagarCuota = usePagarCuota()

  const [pagoModal, setPagoModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState<CuotaPrestamo | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO')
  const [pagoComprobante, setPagoComprobante] = useState('')

  if (isLoading) {
    return <LoadingSpinner />
  }

  const prestamo = data?.data as Prestamo | undefined
  if (!prestamo) {
    return <div className="text-center py-20 text-gray-500">Crédito no encontrado</div>
  }

  const abrirPago = (cuota: CuotaPrestamo) => {
    setSelectedCuota(cuota)
    setPagoMonto(String(cuota.saldoPendiente))
    setPagoMetodo('EFECTIVO')
    setPagoComprobante('')
    setPagoModal(true)
  }

  const handlePago = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCuota) return
    const monto = parseFloat(pagoMonto)
    if (!monto || monto <= 0) {
      toast.error('Ingrese un monto válido mayor a 0')
      return
    }
    if (monto > Number(selectedCuota.saldoPendiente)) {
      toast.error('El monto no puede exceder el saldo pendiente')
      return
    }

    pagarCuota.mutate(
      {
        cuotaId: selectedCuota.id,
        monto,
        metodoPago: pagoMetodo,
        comprobante: pagoComprobante || undefined,
      },
      {
        onSuccess: () => {
          setPagoModal(false)
          setSelectedCuota(null)
        },
      }
    )
  }

  const totalPagado = (prestamo.cuotas || []).reduce((sum, c) => sum + Number(c.montoPagado), 0)
  const totalPendiente = (prestamo.cuotas || []).reduce((sum, c) => sum + Number(c.saldoPendiente), 0)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Detalle del Crédito"
          description={`Crédito #${prestamo.id} - ${prestamo.socio.nombres} ${prestamo.socio.apellidoPaterno}`}
        />
        <Button as="link" to="/creditos" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
      </div>

      {/* Resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card padding="md" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Monto Prestado</p>
          <p className="text-xl font-bold text-[#111827]">{formatMonto(prestamo.monto, prestamo.fondo.moneda)}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total Pagado</p>
          <p className="text-xl font-bold text-emerald-600">{formatMonto(totalPagado, prestamo.fondo.moneda)}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Saldo Pendiente</p>
          <p className="text-xl font-bold text-amber-600">{formatMonto(totalPendiente, prestamo.fondo.moneda)}</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Estado</p>
          <div className="mt-1 flex justify-center">{estadoBadge(prestamo.estado)}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info del crédito */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-[#111827]">Información</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tasa Interés</span>
              <span className="font-medium">{prestamo.tasaInteres}% mensual</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cuotas</span>
              <span className="font-medium">{prestamo.numeroCuotas} × {formatMonto(prestamo.montoCuota)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Intereses</span>
              <span className="font-medium">{formatMonto(prestamo.totalInteres)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Desembolso</span>
              <span className="font-medium">{formatDate(prestamo.fechaDesembolso)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">1er Vencimiento</span>
              <span className="font-medium">{formatDate(prestamo.fechaPrimerVencimiento)}</span>
            </div>
          </div>
        </Card>

        {/* Relacionado */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-[#111827]">Relacionado</h3>
          <div className="space-y-3">
            <Link to={`/socios/${prestamo.socio.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-[#2563EB]/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827]">{prestamo.socio.nombres} {prestamo.socio.apellidoPaterno}</p>
                <p className="text-xs text-gray-500">{prestamo.socio.codigo} · {prestamo.socio.dni}</p>
              </div>
            </Link>
            <Link to={`/fondos/${prestamo.fondo.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-[#2563EB]/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827]">{prestamo.fondo.nombre}</p>
                <p className="text-xs text-gray-500">{prestamo.fondo.moneda}</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Progreso */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-[#111827]">Progreso</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cuotas Pagadas</span>
              <span className="font-medium">{(prestamo.cuotas || []).filter(c => c.estado === 'PAGADO').length} / {prestamo.numeroCuotas}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${((prestamo.cuotas || []).filter(c => c.estado === 'PAGADO').length / prestamo.numeroCuotas) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cuotas Vencidas</span>
              <span className="font-medium text-red-600">{(prestamo.cuotas || []).filter(c => c.estado === 'VENCIDO').length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de cuotas */}
      <Card padding="lg" className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Cuotas</h3>
          </div>
          <Badge variant="green">{prestamo.cuotas?.length || 0} cuotas</Badge>
        </div>

        {(!prestamo.cuotas || prestamo.cuotas.length === 0) ? (
          <p className="py-8 text-center text-sm text-gray-400">No hay cuotas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 text-left font-medium text-gray-500">#</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Vencimiento</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Cuota</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Interés</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Amort.</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Saldo</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Pagado</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-500">Estado</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {prestamo.cuotas.map((cuota) => (
                  <tr key={cuota.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                    <td className="px-3 py-3 font-medium">{cuota.numero}</td>
                    <td className="px-3 py-3 text-gray-600">{formatDate(cuota.fechaVencimiento)}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatMonto(cuota.monto)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatMonto(cuota.interes)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatMonto(cuota.amortizacion)}</td>
                    <td className="px-3 py-3 text-right text-amber-600">{formatMonto(cuota.saldo)}</td>
                    <td className="px-3 py-3 text-right text-emerald-600">{formatMonto(cuota.montoPagado)}</td>
                    <td className="px-3 py-3 text-center">{cuotaEstadoBadge(cuota.estado)}</td>
                    <td className="px-3 py-3 text-right">
                      {cuota.estado !== 'PAGADO' && cuota.estado !== 'ANULADO' && prestamo.estado === 'ACTIVO' && (
                        <Button size="sm" onClick={() => abrirPago(cuota)} iconLeft={<DollarSign className="h-3.5 w-3.5" />}>
                          Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-semibold">
                  <td className="px-3 py-3 text-sm text-gray-500" colSpan={2}>Totales</td>
                  <td className="px-3 py-3 text-right">
                    {formatMonto(prestamo.cuotas.reduce((s, c) => s + c.monto, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {formatMonto(prestamo.cuotas.reduce((s, c) => s + c.interes, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {formatMonto(prestamo.cuotas.reduce((s, c) => s + c.amortizacion, 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-amber-700">{formatMonto(prestamo.monto)}</td>
                  <td className="px-3 py-3 text-right text-emerald-700">
                    {formatMonto(prestamo.cuotas.reduce((s, c) => s + c.montoPagado, 0))}
                  </td>
                  <td className="px-3 py-3" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Pago */}
      <Modal open={pagoModal} onClose={() => setPagoModal(false)} title="Pagar Cuota" maxWidth="sm">
        <form onSubmit={handlePago} className="space-y-4">
          {selectedCuota && (
            <div className="rounded-xl bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cuota #{selectedCuota.numero}</span>
                <span className="font-medium">{formatDate(selectedCuota.fechaVencimiento)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-gray-500">Saldo Pendiente</span>
                <span className="font-bold text-amber-600">{formatMonto(selectedCuota.saldoPendiente)}</span>
              </div>
            </div>
          )}

          <FormField label="Monto a Pagar" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedCuota?.saldoPendiente}
              value={pagoMonto}
              onChange={(e) => setPagoMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormField>

          <FormField label="Método de Pago">
            <Select
              value={pagoMetodo}
              onChange={(e) => setPagoMetodo(e.target.value)}
              options={[
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'TRANSFERENCIA', label: 'Transferencia' },
                { value: 'DEPOSITO', label: 'Depósito' },
              ]}
            />
          </FormField>

          <FormField label="N° Comprobante">
            <Input
              value={pagoComprobante}
              onChange={(e) => setPagoComprobante(e.target.value)}
              placeholder="Opcional"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setPagoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" iconLeft={<CheckCircle className="h-4 w-4" />} loading={pagarCuota.isPending}>
              Registrar Pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
