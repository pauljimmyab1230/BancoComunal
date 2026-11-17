import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Pencil,
  Trash2,
  Printer,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import {
  useCredito,
  usePagarCuota,
  useAnularCredito,
  useLiquidarCredito,
} from '../hooks/useCreditos'
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  Modal,
  ConfirmDialog,
  FormField,
  Input,
  Select,
} from '@/components/ui'
import { openProtectedPdf, getErrorMessage } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar, exportCsv, exportXlsx } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Prestamo, CuotaPrestamo } from '../types'

const cuotaEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'PAGADO':
      return <Badge variant="green">Pagado</Badge>
    case 'PENDIENTE':
      return <Badge variant="yellow">Pendiente</Badge>
    case 'VENCIDO':
      return <Badge variant="red">Vencido</Badge>
    case 'PARCIAL':
      return <Badge variant="blue">Parcial</Badge>
    case 'ANULADO':
      return <Badge variant="gray">Anulado</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CreditoDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useCredito(Number(id))
  const pagarCuota = usePagarCuota()
  const anularMutation = useAnularCredito()
  const liquidarMutation = useLiquidarCredito()

  const [pagoModal, setPagoModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState<CuotaPrestamo | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO')
  const [pagoComprobante, setPagoComprobante] = useState('')
  const [anularModal, setAnularModal] = useState(false)
  const [liquidarModal, setLiquidarModal] = useState(false)
  const [liquidarMetodo, setLiquidarMetodo] = useState('EFECTIVO')
  const [liquidarComprobante, setLiquidarComprobante] = useState('')
  const [printingCronograma, setPrintingCronograma] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const prestamo = data?.data as Prestamo | undefined
  if (!prestamo) {
    return <div className="text-center py-20 text-muted">Crédito no encontrado</div>
  }

  const handleImprimirCronograma = async () => {
    try {
      setPrintingCronograma(true)
      await openProtectedPdf(`/reportes/cronograma-cuotas/pdf?prestamoId=${prestamo.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el cronograma de cuotas'))
    } finally {
      setPrintingCronograma(false)
    }
  }

  const exportarCronograma = (formato: 'csv' | 'xlsx') => {
    const cuotas = prestamo.cuotas || []
    const headers = [
      'N°',
      'Vencimiento',
      'Cuota',
      'Interés',
      'Amortización',
      'Saldo',
      'Pagado',
      'Estado',
    ]
    const filas = cuotas.map((c) => [
      c.numero,
      new Date(c.fechaVencimiento).toLocaleDateString('es-PE'),
      c.monto,
      c.interes,
      c.amortizacion,
      c.saldo,
      c.montoPagado,
      c.estado,
    ])
    if (formato === 'csv') exportCsv(`cronograma-credito-${prestamo.id}.csv`, headers, filas)
    else exportXlsx(`cronograma-credito-${prestamo.id}.xlsx`, headers, filas)
    setExportOpen(false)
  }

  const abrirPago = (cuota: CuotaPrestamo) => {
    if (prestamo.estado !== 'ACTIVO') {
      toast.error('Solo se pueden pagar cuotas de créditos activos')
      return
    }
    setSelectedCuota(cuota)
    setPagoMonto(String(cuota.saldoPendiente))
    setPagoMetodo('EFECTIVO')
    setPagoComprobante('')
    setPagoModal(true)
  }

  const cuotasPagadas = (prestamo.cuotas || []).filter((c) => c.estado === 'PAGADO').length
  const puedeEditar = prestamo.estado === 'ACTIVO' && cuotasPagadas === 0

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
  const totalPendiente = (prestamo.cuotas || []).reduce(
    (sum, c) => sum + Number(c.saldoPendiente),
    0
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          as="link"
          to="/creditos"
          variant="ghost"
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
        <div className="flex-1" />
        {puedeEditar && (
          <Button
            as="link"
            to={`/creditos/${prestamo.id}/editar`}
            variant="secondary"
            iconLeft={<Pencil className="h-4 w-4" />}
          >
            Editar
          </Button>
        )}
        {prestamo.estado === 'ACTIVO' && (
          <>
            <Button
              variant="primary"
              iconLeft={<DollarSign className="h-4 w-4" />}
              onClick={() => {
                setLiquidarMetodo('EFECTIVO')
                setLiquidarComprobante('')
                setLiquidarModal(true)
              }}
            >
              Liquidar
            </Button>
            <Button
              variant="danger"
              iconLeft={<Trash2 className="h-4 w-4" />}
              onClick={() => setAnularModal(true)}
            >
              Anular
            </Button>
          </>
        )}
      </div>

      {/* Hero financiero */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-secondary via-secondary-strong to-accent px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold text-white ring-2 ring-white/40">
                {getSocioIniciales(prestamo.socio.nombres, prestamo.socio.apellidoPaterno)}
              </div>
              <div>
                <p className="text-sm text-white/80">Crédito #{prestamo.id}</p>
                <h1 className="text-2xl font-bold text-white">
                  {prestamo.socio.nombres} {prestamo.socio.apellidoPaterno}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {prestamo.estado === 'ACTIVO'
                      ? 'Activo'
                      : prestamo.estado === 'PAGADO'
                        ? 'Pagado'
                        : 'Anulado'}
                  </span>
                  <Link
                    to={`/fondos/${prestamo.fondo.id}`}
                    className="text-sm text-white/80 hover:text-white"
                  >
                    {prestamo.fondo.nombre}
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Prestado
                </p>
                <p className="text-xl font-bold text-white">
                  {formatMonto(prestamo.monto, prestamo.fondo.moneda)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Pagado
                </p>
                <p className="text-xl font-bold text-white">
                  {formatMonto(totalPagado, prestamo.fondo.moneda)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Pendiente
                </p>
                <p className="text-xl font-bold text-white">
                  {formatMonto(totalPendiente, prestamo.fondo.moneda)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info del crédito */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Información</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tasa Interés</span>
              <span className="font-medium">{prestamo.tasaInteres}% mensual</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Cuotas</span>
              <span className="font-medium">
                {prestamo.numeroCuotas} × {formatMonto(prestamo.montoCuota, prestamo.fondo.moneda)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Intereses</span>
              <span className="font-medium">
                {formatMonto(prestamo.totalInteres, prestamo.fondo.moneda)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Desembolso</span>
              <span className="font-medium">{formatDate(prestamo.fechaDesembolso)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">1er Vencimiento</span>
              <span className="font-medium">{formatDate(prestamo.fechaPrimerVencimiento)}</span>
            </div>
          </div>
        </Card>

        {/* Relacionado */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Relacionado</h3>
          <div className="space-y-3">
            <Link
              to={`/socios/${prestamo.socio.id}`}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition-colors hover:bg-secondary/5"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getClaseAvatar(prestamo.socio.codigo)}`}
              >
                {getSocioIniciales(prestamo.socio.nombres, prestamo.socio.apellidoPaterno)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {prestamo.socio.nombres} {prestamo.socio.apellidoPaterno}
                </p>
                <p className="text-xs text-muted">
                  {prestamo.socio.codigo} · {prestamo.socio.dni}
                </p>
              </div>
            </Link>
            <Link
              to={`/fondos/${prestamo.fondo.id}`}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition-colors hover:bg-secondary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{prestamo.fondo.nombre}</p>
                <p className="text-xs text-muted">{prestamo.fondo.moneda}</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Progreso */}
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Progreso</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Cuotas Pagadas</span>
              <span className="font-medium">
                {(prestamo.cuotas || []).filter((c) => c.estado === 'PAGADO').length} /{' '}
                {prestamo.numeroCuotas}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${((prestamo.cuotas || []).filter((c) => c.estado === 'PAGADO').length / prestamo.numeroCuotas) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Cuotas Vencidas</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {(prestamo.cuotas || []).filter((c) => c.estado === 'VENCIDO').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de cuotas */}
      <Card padding="lg" className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold text-foreground">Cuotas</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="green">{prestamo.cuotas?.length || 0} cuotas</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleImprimirCronograma}
              disabled={printingCronograma}
              iconLeft={<Printer className="h-4 w-4" />}
            >
              {printingCronograma ? 'Generando...' : 'Cronograma PDF'}
            </Button>
            <div className="relative" ref={exportRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportOpen(!exportOpen)}
                iconLeft={<Download className="h-4 w-4" />}
                iconRight={<ChevronDown className="h-4 w-4" />}
              >
                Exportar
              </Button>
              {exportOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[var(--shadow-pop)]">
                  <button
                    type="button"
                    onClick={() => exportarCronograma('csv')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                  >
                    <FileText className="h-4 w-4 text-subtle" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarCronograma('xlsx')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-subtle" />
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!prestamo.cuotas || prestamo.cuotas.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">No hay cuotas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    #
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    Vencimiento
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Cuota
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Interés
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Amort.
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Saldo
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Pagado
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted">
                    Estado
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {prestamo.cuotas.map((cuota) => (
                  <tr key={cuota.id} className="transition-colors hover:bg-surface-muted/60">
                    <td className="px-5 py-4 font-medium">{cuota.numero}</td>
                    <td className="px-5 py-4 text-muted">{formatDate(cuota.fechaVencimiento)}</td>
                    <td className="px-5 py-4 text-right font-medium">{formatMonto(cuota.monto)}</td>
                    <td className="px-5 py-4 text-right text-muted">
                      {formatMonto(cuota.interes)}
                    </td>
                    <td className="px-5 py-4 text-right text-muted">
                      {formatMonto(cuota.amortizacion)}
                    </td>
                    <td className="px-5 py-4 text-right text-amber-600 dark:text-amber-400">
                      {formatMonto(cuota.saldo)}
                    </td>
                    <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400">
                      {formatMonto(cuota.montoPagado)}
                      {cuota.fechaPago && (
                        <p className="text-xs font-normal text-subtle">
                          {new Date(cuota.fechaPago).toLocaleDateString('es-PE')}
                          {cuota.metodoPago ? ` · ${cuota.metodoPago}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">{cuotaEstadoBadge(cuota.estado)}</td>
                    <td className="px-5 py-4 text-right">
                      {cuota.estado !== 'PAGADO' &&
                        cuota.estado !== 'ANULADO' &&
                        prestamo.estado === 'ACTIVO' && (
                          <Button
                            size="sm"
                            onClick={() => abrirPago(cuota)}
                            iconLeft={<DollarSign className="h-3.5 w-3.5" />}
                          >
                            Pagar
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-surface-muted font-semibold">
                  <td className="px-5 py-4 text-sm text-muted" colSpan={2}>
                    Totales
                  </td>
                  <td className="px-5 py-4 text-right">
                    {formatMonto(
                      prestamo.cuotas.reduce((s, c) => s + c.monto, 0),
                      prestamo.fondo.moneda
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-foreground">
                    {formatMonto(
                      prestamo.cuotas.reduce((s, c) => s + c.interes, 0),
                      prestamo.fondo.moneda
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-foreground">
                    {formatMonto(
                      prestamo.cuotas.reduce((s, c) => s + c.amortizacion, 0),
                      prestamo.fondo.moneda
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-amber-700 dark:text-amber-300">
                    {formatMonto(prestamo.monto, prestamo.fondo.moneda)}
                  </td>
                  <td className="px-5 py-4 text-right text-emerald-700 dark:text-emerald-300">
                    {formatMonto(
                      prestamo.cuotas.reduce((s, c) => s + c.montoPagado, 0),
                      prestamo.fondo.moneda
                    )}
                  </td>
                  <td className="px-5 py-4" colSpan={2} />
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
            <div className="rounded-xl bg-surface-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Cuota #{selectedCuota.numero}</span>
                <span className="font-medium">{formatDate(selectedCuota.fechaVencimiento)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted">Saldo Pendiente</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatMonto(selectedCuota.saldoPendiente, prestamo.fondo.moneda)}
                </span>
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
            <Button
              type="submit"
              iconLeft={<CheckCircle className="h-4 w-4" />}
              loading={pagarCuota.isPending}
            >
              Registrar Pago
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Liquidar */}
      <Modal
        open={liquidarModal}
        onClose={() => setLiquidarModal(false)}
        title="Liquidar Préstamo"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-medium">Atención</p>
            <p className="mt-1">
              Se pagará el saldo total pendiente del préstamo y se marcará como{' '}
              <strong>PAGADO</strong>.
            </p>
            <p className="mt-1 font-semibold">
              Saldo total: {formatMonto(totalPendiente, prestamo.fondo.moneda)}
            </p>
          </div>

          <FormField label="Método de Pago" required>
            <Select
              value={liquidarMetodo}
              onChange={(e) => setLiquidarMetodo(e.target.value)}
              options={[
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'TRANSFERENCIA', label: 'Transferencia' },
                { value: 'DEPOSITO', label: 'Depósito' },
              ]}
            />
          </FormField>

          <FormField label="N° Comprobante">
            <Input
              value={liquidarComprobante}
              onChange={(e) => setLiquidarComprobante(e.target.value)}
              placeholder="Opcional"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setLiquidarModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                liquidarMutation.mutate(
                  {
                    prestamoId: prestamo.id,
                    metodoPago: liquidarMetodo,
                    comprobante: liquidarComprobante || undefined,
                  },
                  { onSuccess: () => setLiquidarModal(false) }
                )
              }}
              loading={liquidarMutation.isPending}
              iconLeft={<CheckCircle className="h-4 w-4" />}
            >
              Confirmar Liquidación
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={anularModal}
        onClose={() => setAnularModal(false)}
        onConfirm={() => {
          anularMutation.mutate(prestamo.id)
          setAnularModal(false)
        }}
        title="Anular Crédito"
        message="¿Estás seguro de anular este crédito? El capital desembolsado será restituido al fondo rotatorio. Solo se puede anular si no tiene cuotas pagadas."
        confirmText="Anular"
        variant="danger"
        loading={anularMutation.isPending}
      />
    </div>
  )
}
