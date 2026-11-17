import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Calculator,
  Eye,
  Trash2,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FilePenLine,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react'
import { useCotizaciones, useEliminarCotizacion } from '../hooks/useCotizaciones'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { cotizacionesApi } from '../api/cotizacionesApi'
import {
  Button,
  DataTable,
  SearchInput,
  Badge,
  SectionHeader,
  Card,
  ConfirmDialog,
  ErrorState,
} from '@/components/ui'
import { getErrorMessage } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar, exportCsv, exportXlsx } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Cotizacion } from '../types'

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

const FILTROS_ESTADO = [
  { value: '', label: 'Todas' },
  { value: 'BORRADOR', label: 'Borradores' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: 'CONVERTIDA', label: 'Convertidas' },
]

const formatMonto = (monto: number, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(fecha)
  )

export default function CotizacionesListPage() {
  const { search, page, estado, actualizar } = useFiltrosUrl('co')
  const [eliminarId, setEliminarId] = useState<number | null>(null)
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

  const { data, isLoading, isError, error, refetch } = useCotizaciones({
    search,
    page,
    limit: 10,
    estado: estado || undefined,
  })
  const eliminarMutation = useEliminarCotizacion()

  const cotizaciones = data?.data || []

  const handleEliminar = () => {
    if (!eliminarId) return
    eliminarMutation.mutate(eliminarId, { onSettled: () => setEliminarId(null) })
  }

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await cotizacionesApi.list({
        search,
        limit: 1000,
        estado: estado || undefined,
      })
      const headers = [
        'Código',
        'Socio',
        'Monto',
        'Tasa',
        'Cuotas',
        'Cuota fija',
        'Estado',
        'Fecha',
      ]
      const filas = result.data.map((c: Cotizacion) => [
        c.codigo,
        c.socio
          ? `${c.socio.nombres} ${c.socio.apellidoPaterno} ${c.socio.apellidoMaterno}`
          : 'Sin socio',
        c.monto,
        `${c.tasaInteres}%`,
        c.numeroCuotas,
        c.montoCuota,
        c.estado,
        c.fechaCotizacion,
      ])
      if (formato === 'csv') exportCsv('cotizaciones.csv', headers, filas)
      else exportXlsx('cotizaciones.xlsx', headers, filas)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar cotizaciones'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'codigo',
      label: 'Cotización',
      render: (c: Cotizacion) => (
        <div>
          <p className="font-mono text-sm font-medium text-foreground">{c.codigo}</p>
          <p className="text-xs text-subtle">{formatoFecha(c.fechaCotizacion)}</p>
        </div>
      ),
    },
    {
      key: 'socio',
      label: 'Socio',
      render: (c: Cotizacion) =>
        c.socio ? (
          <Link to={`/socios/${c.socio.id}`} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(c.socio.codigo)}`}
            >
              {getSocioIniciales(c.socio.nombres, c.socio.apellidoPaterno)}
            </div>
            <div>
              <p className="font-medium text-foreground hover:text-secondary">
                {c.socio.nombres} {c.socio.apellidoPaterno}
              </p>
              <p className="text-xs text-subtle">{c.socio.codigo}</p>
            </div>
          </Link>
        ) : (
          <span className="text-sm text-subtle">Sin socio asignado</span>
        ),
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (c: Cotizacion) => (
        <div>
          <p className="font-medium text-foreground">{formatMonto(c.monto, c.fondo?.moneda)}</p>
          <p className="text-xs text-subtle">
            {c.tasaInteres}% · {c.numeroCuotas} cuotas
          </p>
        </div>
      ),
    },
    {
      key: 'cuota',
      label: 'Cuota fija',
      render: (c: Cotizacion) => (
        <div>
          <p className="text-sm text-foreground">{formatMonto(c.montoCuota, c.fondo?.moneda)}</p>
          <p className="text-xs text-subtle">
            Interés {formatMonto(c.totalInteres, c.fondo?.moneda)}
          </p>
        </div>
      ),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (c: Cotizacion) =>
        c.fondo ? (
          <Link to={`/fondos/${c.fondo.id}`} className="text-sm text-muted hover:text-secondary">
            {c.fondo.nombre}
          </Link>
        ) : (
          <span className="text-sm text-subtle">—</span>
        ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (c: Cotizacion) => estadoBadge(c.estado),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (c: Cotizacion) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/cotizaciones/${c.id}`}
            aria-label={`Ver cotización ${c.codigo}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {c.estado !== 'CONVERTIDA' && (
            <button
              onClick={() => setEliminarId(c.id)}
              aria-label={`Eliminar cotización ${c.codigo}`}
              title="Eliminar"
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const desde = ((data?.page ?? 1) - 1) * (data?.limit ?? 10) + 1
  const hasta = Math.min((data?.page ?? 1) * (data?.limit ?? 10), data?.total ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Cotizaciones"
          description="Simula créditos y envía la tabla de amortización al cliente"
        />
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportRef}>
            <Button
              variant="secondary"
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
                  onClick={() => exportar('csv')}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                >
                  <FileText className="h-4 w-4 text-subtle" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportar('xlsx')}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                >
                  <FileSpreadsheet className="h-4 w-4 text-subtle" />
                  Excel
                </button>
              </div>
            )}
          </div>
          <Button as="link" to="/cotizaciones/nueva" iconLeft={<Plus className="h-4 w-4" />}>
            Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : data?.total || 0}
              </p>
              <p className="text-xs text-muted">Total Cotizaciones</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <FilePenLine className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : (data?.resumenEstados?.BORRADOR ?? 0)}
              </p>
              <p className="text-xs text-muted">En Borrador</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : (data?.resumenEstados?.APROBADA ?? 0)}
              </p>
              <p className="text-xs text-muted">Aprobadas</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : (data?.resumenEstados?.CONVERTIDA ?? 0)}
              </p>
              <p className="text-xs text-muted">Convertidas</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por código, socio o fondo..."
            value={search}
            onChange={(val) => {
              actualizar({ search: val })
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                actualizar({ estado: f.value })
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                estado === f.value
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={cotizaciones}
            loading={isLoading}
            keyField="id"
            emptyTitle="No hay cotizaciones registradas"
            emptyDescription="Crea una cotización para simular un crédito y compartirlo con el cliente."
            emptyActionLabel="Nueva Cotización"
            emptyActionTo="/cotizaciones/nueva"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} cotizaciones
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={eliminarId !== null}
        onClose={() => setEliminarId(null)}
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
