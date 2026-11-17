import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Pencil,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Users,
  Building2,
  Calendar,
  Percent,
  Wallet,
  FileClock,
} from 'lucide-react'
import {
  useCotizacion,
  useCambiarEstadoCotizacion,
  useConvertirCotizacion,
  useEliminarCotizacion,
} from '../hooks/useCotizaciones'
import { Button, Badge, Card, ConfirmDialog, ErrorState, LoadingSpinner } from '@/components/ui'
import { resumenAmortizacion } from '@/lib/amortizacion'
import { getSocioIniciales, getClaseAvatar, exportCsv, exportXlsx } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Cotizacion } from '../types'

const formatMonto = (monto: number, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)

const formatoFecha = (fecha: string | Date) =>
  new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(typeof fecha === 'string' ? new Date(fecha) : fecha)

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'BORRADOR':
      return <Badge variant="yellow">Borrador</Badge>
    case 'APROBADA':
      return <Badge variant="green">Aprobada</Badge>
    case 'RECHAZADA':
      return <Badge variant="red">Rechazada</Badge>
    case 'CONVERTIDA':
      return <Badge variant="blue">Convertida</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

export default function CotizacionDetailPage() {
  const { id } = useParams()
  const cotizacionId = Number(id)

  const { data, isLoading, isError, error, refetch } = useCotizacion(cotizacionId)
  const cambiarEstadoMutation = useCambiarEstadoCotizacion()
  const convertirMutation = useConvertirCotizacion()
  const eliminarMutation = useEliminarCotizacion()

  const [accion, setAccion] = useState<'convertir' | 'eliminar' | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  if (isLoading) return <LoadingSpinner text="Cargando cotización..." />

  if (isError || !data?.data) {
    return <ErrorState error={error} onRetry={() => refetch()} />
  }

  const cotizacion: Cotizacion = data.data
  const moneda = cotizacion.fondo?.moneda || 'PEN'

  const resumen = resumenAmortizacion(
    cotizacion.monto,
    cotizacion.tasaInteres,
    cotizacion.numeroCuotas,
    new Date(cotizacion.fechaPrimerVencimiento)
  )

  const puedeConvertir =
    ['BORRADOR', 'APROBADA'].includes(cotizacion.estado) &&
    !!cotizacion.fondoId &&
    !!cotizacion.socioId

  const exportarTabla = (formato: 'csv' | 'xlsx') => {
    const headers = ['N°', 'Vencimiento', 'Cuota', 'Interés', 'Amortización', 'Saldo']
    const filas = resumen.tabla.map((c) => [
      c.numero,
      c.fechaVencimiento.toISOString().slice(0, 10),
      c.cuota,
      c.interes,
      c.amortizacion,
      c.saldo,
    ])
    if (formato === 'csv') exportCsv(`cotizacion-${cotizacion.codigo}.csv`, headers, filas)
    else exportXlsx(`cotizacion-${cotizacion.codigo}.xlsx`, headers, filas)
    setExportOpen(false)
  }

  const handleConvertir = () => {
    convertirMutation.mutate(cotizacion.id, { onSettled: () => setAccion(null) })
  }

  const handleEliminar = () => {
    eliminarMutation.mutate(cotizacion.id, { onSettled: () => setAccion(null) })
  }

  const imprimir = () => {
    if (resumen.tabla.length === 0) {
      toast.error('No hay cuotas para imprimir')
      return
    }
    window.print()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-imprimir">
        <Button
          as="link"
          to="/cotizaciones"
          variant="ghost"
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Volver a cotizaciones
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {cotizacion.estado === 'BORRADOR' && (
            <Button
              variant="secondary"
              iconLeft={<Pencil className="h-4 w-4" />}
              as="link"
              to={`/cotizaciones/${cotizacion.id}/editar`}
            >
              Editar
            </Button>
          )}

          {['BORRADOR', 'APROBADA'].includes(cotizacion.estado) && (
            <>
              {cotizacion.estado === 'BORRADOR' && (
                <Button
                  variant="secondary"
                  iconLeft={<CheckCircle2 className="h-4 w-4" />}
                  loading={cambiarEstadoMutation.isPending}
                  onClick={() =>
                    cambiarEstadoMutation.mutate({
                      id: cotizacion.id,
                      estado: 'APROBADA',
                    })
                  }
                >
                  Aprobar
                </Button>
              )}
              <Button
                variant="secondary"
                iconLeft={<XCircle className="h-4 w-4" />}
                loading={cambiarEstadoMutation.isPending}
                onClick={() =>
                  cambiarEstadoMutation.mutate({ id: cotizacion.id, estado: 'RECHAZADA' })
                }
              >
                Rechazar
              </Button>
            </>
          )}

          {cotizacion.estado === 'RECHAZADA' && (
            <Button
              variant="secondary"
              iconLeft={<RotateCcw className="h-4 w-4" />}
              loading={cambiarEstadoMutation.isPending}
              onClick={() =>
                cambiarEstadoMutation.mutate({ id: cotizacion.id, estado: 'BORRADOR' })
              }
            >
              Volver a borrador
            </Button>
          )}

          {cotizacion.estado === 'CONVERTIDA' && cotizacion.prestamoId && (
            <Button as="link" to={`/creditos/${cotizacion.prestamoId}`} variant="secondary">
              Ver crédito #{cotizacion.prestamoId}
            </Button>
          )}

          {puedeConvertir && (
            <Button
              iconLeft={<ArrowRightLeft className="h-4 w-4" />}
              onClick={() => setAccion('convertir')}
            >
              Convertir a crédito
            </Button>
          )}

          {cotizacion.estado !== 'CONVERTIDA' && (
            <Button
              variant="danger"
              iconLeft={<Trash2 className="h-4 w-4" />}
              onClick={() => setAccion('eliminar')}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="cotizacion-imprimible space-y-6">
        {/* Encabezado tipo portada */}
        <div className="cotizacion-encabezado relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary-strong to-accent p-6 text-white shadow-[var(--shadow-pop)] sm:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-semibold tracking-wide backdrop-blur">
                  {cotizacion.codigo}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {cotizacion.estado}
                </span>
              </div>
              <p className="mt-4 text-sm text-white/80">Monto cotizado</p>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                {formatMonto(cotizacion.monto, moneda)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Cotizada el {formatoFecha(cotizacion.fechaCotizacion)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="h-4 w-4" />
                  {cotizacion.tasaInteres}% mensual · {cotizacion.numeroCuotas} cuotas
                </span>
              </div>
            </div>

            <div className="no-imprimir flex flex-wrap gap-2">
              <button
                type="button"
                onClick={imprimir}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen(!exportOpen)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-4 w-4" />
                </button>
                {exportOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 text-foreground shadow-[var(--shadow-pop)]">
                    <button
                      type="button"
                      onClick={() => exportarTabla('csv')}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover"
                    >
                      <FileText className="h-4 w-4 text-subtle" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => exportarTabla('xlsx')}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-subtle" />
                      Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="md" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatMonto(resumen.montoCuota, moneda)}
                </p>
                <p className="text-xs text-muted">Cuota fija</p>
              </div>
            </div>
          </Card>
          <Card padding="md" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatMonto(resumen.totalInteres, moneda)}
                </p>
                <p className="text-xs text-muted">Total intereses</p>
              </div>
            </div>
          </Card>
          <Card padding="md" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatMonto(resumen.totalPagar, moneda)}
                </p>
                <p className="text-xs text-muted">Total a pagar</p>
              </div>
            </div>
          </Card>
          <Card padding="md" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                <FileClock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {cotizacion.numeroCuotas} cuotas
                </p>
                <p className="text-xs text-muted">
                  Desde {formatoFecha(cotizacion.fechaPrimerVencimiento)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Datos generales */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" padding="lg" hover={false}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Datos de la cotización</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-subtle">Socio</p>
                {cotizacion.socio ? (
                  <Link
                    to={`/socios/${cotizacion.socio.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-secondary"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(cotizacion.socio.codigo)}`}
                    >
                      {getSocioIniciales(
                        cotizacion.socio.nombres,
                        cotizacion.socio.apellidoPaterno
                      )}
                    </span>
                    {cotizacion.socio.nombres} {cotizacion.socio.apellidoPaterno}
                  </Link>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-subtle">
                    <Users className="h-4 w-4" /> Sin socio asignado
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-subtle">Fondo</p>
                {cotizacion.fondo ? (
                  <Link
                    to={`/fondos/${cotizacion.fondo.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-secondary"
                  >
                    <Building2 className="h-4 w-4 text-subtle" />
                    {cotizacion.fondo.nombre}
                  </Link>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-subtle">
                    <Building2 className="h-4 w-4" /> Sin fondo asignado
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-subtle">Estado</p>
                {estadoBadge(cotizacion.estado)}
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-subtle">
                  Primer vencimiento
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatoFecha(cotizacion.fechaPrimerVencimiento)}
                </p>
              </div>
            </div>

            {cotizacion.observacion && (
              <div className="mt-6 rounded-xl border border-border bg-surface-muted/40 p-4">
                <p className="mb-1 text-xs uppercase tracking-wide text-subtle">Observación</p>
                <p className="text-sm text-muted">{cotizacion.observacion}</p>
              </div>
            )}
          </Card>

          <Card padding="lg" hover={false}>
            <h2 className="mb-4 text-base font-semibold text-foreground">Condiciones</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Monto</dt>
                <dd className="font-medium text-foreground">
                  {formatMonto(cotizacion.monto, moneda)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Tasa mensual</dt>
                <dd className="font-medium text-foreground">{cotizacion.tasaInteres}%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">N° cuotas</dt>
                <dd className="font-medium text-foreground">{cotizacion.numeroCuotas}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                <dt className="text-muted">Interés total</dt>
                <dd className="font-medium text-foreground">
                  {formatMonto(resumen.totalInteres, moneda)}
                </dd>
              </div>
              {cotizacion.estado === 'CONVERTIDA' && cotizacion.prestamoId && (
                <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                  <dt className="text-muted">Crédito generado</dt>
                  <dd>
                    <Link
                      to={`/creditos/${cotizacion.prestamoId}`}
                      className="font-medium text-secondary hover:underline"
                    >
                      #{cotizacion.prestamoId}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Tabla de amortización */}
        <Card padding="none" hover={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tabla de amortización</h2>
              <p className="text-xs text-muted">
                Cuota fija (sistema francés) · {cotizacion.numeroCuotas} cuotas
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="no-imprimir"
              onClick={imprimir}
              iconLeft={<Printer className="h-4 w-4" />}
            >
              Imprimir
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">N°</th>
                  <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
                  <th className="px-4 py-3 text-right font-semibold">Cuota</th>
                  <th className="px-4 py-3 text-right font-semibold">Interés</th>
                  <th className="px-4 py-3 text-right font-semibold">Amortización</th>
                  <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {resumen.tabla.map((cuota) => (
                  <tr key={cuota.numero} className="hover:bg-surface-hover/50">
                    <td className="px-4 py-3 font-medium text-foreground">{cuota.numero}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(cuota.fechaVencimiento)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatMonto(cuota.cuota, moneda)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-300">
                      {formatMonto(cuota.interes, moneda)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatMonto(cuota.amortizacion, moneda)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatMonto(cuota.saldo, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-muted/60 font-semibold text-foreground">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    Totales
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMonto(resumen.totalPagar, moneda)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMonto(resumen.totalInteres, moneda)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatMonto(cotizacion.monto, moneda)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-subtle">
          Cotización válida como referencia. Los montos pueden variar al momento del desembolso.
        </p>
      </div>

      <ConfirmDialog
        open={accion === 'convertir'}
        onClose={() => setAccion(null)}
        onConfirm={handleConvertir}
        title="Convertir en crédito"
        message={`¿Convertir la cotización ${cotizacion.codigo} en un crédito real por ${formatMonto(cotizacion.monto, moneda)}? Se desembolsará el monto y se generará el cronograma de cuotas.`}
        confirmText="Convertir"
        loading={convertirMutation.isPending}
      />

      <ConfirmDialog
        open={accion === 'eliminar'}
        onClose={() => setAccion(null)}
        onConfirm={handleEliminar}
        title="Eliminar Cotización"
        message="¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={eliminarMutation.isPending}
      />
    </div>
  )
}
