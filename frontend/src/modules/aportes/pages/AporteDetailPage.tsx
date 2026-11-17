import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Receipt,
  Trash2,
  Pencil,
  Banknote,
} from 'lucide-react'
import { useAporte, useDeleteAporte } from '../hooks/useAportes'
import { Button, Card, Badge, LoadingSpinner, ConfirmDialog } from '@/components/ui'
import { getSocioIniciales, getClaseAvatar } from '@/lib/utils'
import { openProtectedPdf, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Aporte } from '../types'

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'OBLIGATORIO':
      return <Badge variant="blue">Obligatorio</Badge>
    case 'EXTRAORDINARIO':
      return <Badge variant="purple">Extraordinario</Badge>
    case 'VOLUNTARIO':
      return <Badge variant="green">Voluntario</Badge>
    case 'MULTA':
      return <Badge variant="red">Multa</Badge>
    default:
      return <Badge>{tipo}</Badge>
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

export default function AporteDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useAporte(Number(id))
  const deleteMutation = useDeleteAporte()
  const [anularOpen, setAnularOpen] = useState(false)

  if (isLoading) {
    return <LoadingSpinner text="Cargando aporte..." />
  }

  const aporte = data?.data as Aporte | undefined
  if (!aporte) {
    return <div className="py-20 text-center text-muted">Aporte no encontrado</div>
  }

  const esActivo = aporte.estado === 'ACTIVO'

  const handleVerComprobante = async () => {
    try {
      await openProtectedPdf(`/reportes/comprobante-aporte/pdf?aporteId=${aporte.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el comprobante de ingreso'))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          as="link"
          to="/aportes"
          variant="ghost"
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Aportes
        </Button>
        <div className="flex-1" />
        <Button
          variant="secondary"
          onClick={handleVerComprobante}
          iconLeft={<Receipt className="h-4 w-4" />}
        >
          Comprobante
        </Button>
        {esActivo && (
          <>
            <Button
              as="link"
              to={`/aportes/${id}/editar`}
              variant="secondary"
              iconLeft={<Pencil className="h-4 w-4" />}
            >
              Editar
            </Button>
            <Button
              variant="danger"
              onClick={() => setAnularOpen(true)}
              iconLeft={<Trash2 className="h-4 w-4" />}
            >
              Anular
            </Button>
          </>
        )}
      </div>

      {/* Cabecera con monto destacado */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-secondary via-secondary-strong to-accent px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40">
                <Banknote className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Aporte #{aporte.id}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {tipoBadge(aporte.tipo)}
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {esActivo ? 'Activo' : 'Anulado'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold text-white sm:text-4xl">
                {formatMonto(aporte.monto, aporte.fondo.moneda)}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {formatDate(aporte.fechaAporte)} · {aporte.periodo}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Información del Aporte</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Tipo</span>
              {tipoBadge(aporte.tipo)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Monto</span>
              <span className="text-xl font-bold text-foreground">
                {formatMonto(aporte.monto, aporte.fondo.moneda)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Período</span>
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Calendar className="h-4 w-4 text-subtle" />
                {aporte.periodo}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Fecha</span>
              <span className="text-sm text-foreground">{formatDate(aporte.fechaAporte)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Método de Pago</span>
              <span className="text-sm font-medium text-foreground">{aporte.metodoPago}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Estado</span>
              {esActivo ? (
                <Badge variant="green">Activo</Badge>
              ) : (
                <Badge variant="gray">Anulado</Badge>
              )}
            </div>
            {aporte.comprobante && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Comprobante</span>
                <span className="flex items-center gap-1 text-sm text-foreground">
                  <FileText className="h-4 w-4 text-subtle" />
                  {aporte.comprobante}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Relacionado</h3>
          <div className="space-y-4">
            <Link
              to={`/socios/${aporte.socio.id}`}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition-colors hover:bg-secondary/5"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getClaseAvatar(aporte.socio.codigo)}`}
              >
                {getSocioIniciales(aporte.socio.nombres, aporte.socio.apellidoPaterno)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {aporte.socio.nombres} {aporte.socio.apellidoPaterno}
                </p>
                <p className="text-xs text-muted">
                  {aporte.socio.codigo} · {aporte.socio.dni}
                </p>
              </div>
            </Link>

            <Link
              to={`/fondos/${aporte.fondo.id}`}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 transition-colors hover:bg-secondary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{aporte.fondo.nombre}</p>
                <p className="text-xs text-muted">{aporte.fondo.moneda}</p>
              </div>
            </Link>
          </div>
        </Card>

        {aporte.observacion && (
          <Card padding="lg" className="md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Observación</h3>
            <p className="text-sm text-muted">{aporte.observacion}</p>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={anularOpen}
        onClose={() => setAnularOpen(false)}
        onConfirm={() => {
          deleteMutation.mutate(aporte.id, { onSuccess: () => setAnularOpen(false) })
        }}
        title="Anular Aporte"
        message="¿Estás seguro de anular este aporte? El capital disponible del fondo se reducirá."
        confirmText="Anular"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
