import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Wallet, Minus, User, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCuentaAhorro, useCrearMovimiento, useActualizarEstadoCuenta } from '../hooks/useAhorros'
import { Button, SectionHeader, Card, Badge, LoadingSpinner, Modal, FormField, Input, Select, ConfirmDialog } from '@/components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import type { CuentaAhorro } from '../types'

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function AhorroDetailPage() {
  const { id } = useParams()
  const [movPage, setMovPage] = useState(1)
  const { data, isLoading } = useCuentaAhorro(Number(id), movPage)
  const createMovimiento = useCrearMovimiento()
  const actualizarEstado = useActualizarEstadoCuenta()

  const [showMovModal, setShowMovModal] = useState(false)
  const [movTipo, setMovTipo] = useState<'DEPOSITO' | 'RETIRO'>('DEPOSITO')
  const [movMonto, setMovMonto] = useState('')
  const [movMetodo, setMovMetodo] = useState('EFECTIVO')
  const [movComprobante, setMovComprobante] = useState('')
  const [movObs, setMovObs] = useState('')
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  if (isLoading) {
    return <LoadingSpinner />
  }

  const cuenta = data?.data as CuentaAhorro | undefined
  if (!cuenta) {
    return <div className="text-center py-20 text-gray-500">Cuenta no encontrada</div>
  }

  const handleMovimiento = (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(movMonto)
    if (!monto || monto <= 0) {
      toast.error('Ingrese un monto válido mayor a 0')
      return
    }

    if (movTipo === 'RETIRO' && monto > cuenta.saldo) {
      toast.error('El monto no puede exceder el saldo disponible')
      return
    }

    createMovimiento.mutate(
      {
        tipo: movTipo,
        monto,
        metodoPago: movMetodo,
        comprobante: movComprobante || undefined,
        observacion: movObs || undefined,
        cuentaId: cuenta.id,
      },
      {
        onSuccess: () => {
          setShowMovModal(false)
          setMovMonto('')
          setMovComprobante('')
          setMovObs('')
        },
      }
    )
  }

  const handleToggleEstado = () => {
    const nuevoEstado = cuenta.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
    actualizarEstado.mutate({ id: cuenta.id, estado: nuevoEstado })
    setShowConfirmClose(false)
  }

  const movimientosTotal = cuenta.movimientosTotal ?? cuenta.movimientos?.length ?? 0
  const movimientosTotalPages = cuenta.movimientosTotalPages ?? 1

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Cuenta de Ahorro"
          description={`${cuenta.socio.nombres} ${cuenta.socio.apellidoPaterno} - ${cuenta.fondo.nombre}`}
        />
        <div className="flex gap-2">
          <Button as="link" to="/ahorros" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
            Volver
          </Button>
          {cuenta.estado === 'ACTIVA' ? (
            <>
              <Button onClick={() => { setMovTipo('DEPOSITO'); setShowMovModal(true) }} iconLeft={<Plus className="h-4 w-4" />}>
                Depósito
              </Button>
              <Button variant="secondary" onClick={() => { setMovTipo('RETIRO'); setShowMovModal(true) }} iconLeft={<Minus className="h-4 w-4" />}>
                Retiro
              </Button>
              <Button variant="danger" onClick={() => setShowConfirmClose(true)}>
                Inactivar
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowConfirmClose(true)}>
              Reactivar
            </Button>
          )}
        </div>
      </div>

      {/* Saldo */}
      <Card padding="lg" className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="text-sm text-gray-500">Saldo Actual</p>
          <Badge variant={cuenta.estado === 'ACTIVA' ? 'green' : 'gray'}>
            {cuenta.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
        <p className={`text-4xl font-bold ${cuenta.saldo > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatMonto(cuenta.saldo, cuenta.fondo.moneda)}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {cuenta.fondo.nombre}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {cuenta.socio.nombres} {cuenta.socio.apellidoPaterno}
          </span>
        </div>
      </Card>

      {/* Movimientos */}
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Movimientos</h3>
          </div>
          <Badge variant="green">{movimientosTotal} registros</Badge>
        </div>

        {(!cuenta.movimientos || cuenta.movimientos.length === 0) ? (
          <p className="py-8 text-center text-sm text-gray-400">No hay movimientos registrados</p>
        ) : (
          <>
            <div className="space-y-3">
              {cuenta.movimientos.map((mov) => (
                <div key={mov.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    mov.tipo === 'DEPOSITO' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {mov.tipo === 'DEPOSITO' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#111827]">
                        {mov.tipo === 'DEPOSITO' ? 'Depósito' : 'Retiro'}
                      </p>
                      <span className="text-xs text-gray-400">
                        {format(new Date(mov.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Saldo antes: {formatMonto(mov.saldoAntes, cuenta.fondo.moneda)}</span>
                      <span>→</span>
                      <span>Saldo después: {formatMonto(mov.saldoDespues, cuenta.fondo.moneda)}</span>
                      {mov.comprobante && <span>· {mov.comprobante}</span>}
                    </div>
                    {mov.observacion && (
                      <p className="mt-1 text-xs text-gray-400">{mov.observacion}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${
                      mov.tipo === 'DEPOSITO' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'DEPOSITO' ? '+' : '-'}{formatMonto(mov.monto, cuenta.fondo.moneda)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {movimientosTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">
                  Página {cuenta.movimientosPage || 1} de {movimientosTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMovPage((p) => Math.max(1, p - 1))}
                    disabled={(cuenta.movimientosPage || 1) <= 1}
                    iconLeft={<ChevronLeft className="h-4 w-4" />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMovPage((p) => Math.min(movimientosTotalPages, p + 1))}
                    disabled={(cuenta.movimientosPage || 1) >= movimientosTotalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Nuevo Movimiento */}
      <Modal open={showMovModal} onClose={() => setShowMovModal(false)} title={movTipo === 'DEPOSITO' ? 'Nuevo Depósito' : 'Nuevo Retiro'} maxWidth="sm">
        <form onSubmit={handleMovimiento} className="space-y-4">
          <FormField label="Tipo">
            <Select
              value={movTipo}
              onChange={(e) => setMovTipo(e.target.value as 'DEPOSITO' | 'RETIRO')}
              options={[
                { value: 'DEPOSITO', label: 'Depósito' },
                { value: 'RETIRO', label: 'Retiro' },
              ]}
            />
          </FormField>

          <FormField label="Monto" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={movTipo === 'RETIRO' ? cuenta.saldo : undefined}
              value={movMonto}
              onChange={(e) => setMovMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormField>

          {movTipo === 'RETIRO' && (
            <p className="text-xs text-gray-500">
              Saldo disponible: {formatMonto(cuenta.saldo, cuenta.fondo.moneda)}
            </p>
          )}

          <FormField label="Método de Pago">
            <Select
              value={movMetodo}
              onChange={(e) => setMovMetodo(e.target.value)}
              options={[
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'TRANSFERENCIA', label: 'Transferencia' },
                { value: 'DEPOSITO', label: 'Depósito' },
              ]}
            />
          </FormField>

          <FormField label="N° Comprobante">
            <Input
              value={movComprobante}
              onChange={(e) => setMovComprobante(e.target.value)}
              placeholder="Opcional"
            />
          </FormField>

          <FormField label="Observación">
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-gray-400"
              value={movObs}
              onChange={(e) => setMovObs(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowMovModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMovimiento.isPending}>
              {movTipo === 'DEPOSITO' ? 'Registrar Depósito' : 'Registrar Retiro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Inactivar/Reactivar */}
      <ConfirmDialog
        open={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleToggleEstado}
        title={cuenta.estado === 'ACTIVA' ? 'Inactivar Cuenta' : 'Reactivar Cuenta'}
        message={
          cuenta.estado === 'ACTIVA'
            ? '¿Estás seguro de inactivar esta cuenta? No se podrán realizar movimientos hasta que se reactive.'
            : '¿Reactivar esta cuenta? Se podrán realizar movimientos nuevamente.'
        }
        confirmText={cuenta.estado === 'ACTIVA' ? 'Inactivar' : 'Reactivar'}
        variant={cuenta.estado === 'ACTIVA' ? 'danger' : 'primary'}
        loading={actualizarEstado.isPending}
      />
    </div>
  )
}
