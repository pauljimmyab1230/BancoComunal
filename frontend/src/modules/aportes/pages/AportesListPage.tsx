import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Eye,
  Trash2,
  Banknote,
  Wallet,
  Calendar,
  Receipt,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAportes, useDeleteAporte } from '../hooks/useAportes'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { aportesApi } from '../api/aportesApi'
import {
  Button,
  DataTable,
  SearchInput,
  Badge,
  SectionHeader,
  Card,
  ConfirmDialog,
  Select,
  Input,
  ErrorState,
} from '@/components/ui'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { openProtectedPdf, getErrorMessage } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar, exportCsv, exportXlsx } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Aporte } from '../types'

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'OBLIGATORIO', label: 'Obligatorio' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'VOLUNTARIO', label: 'Voluntario' },
  { value: 'MULTA', label: 'Multa' },
]

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'ANULADO', label: 'Anulados' },
]

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

export default function AportesListPage() {
  const [searchParams] = useSearchParams()
  const { search, page, tipo, estado, periodo, actualizar } = useFiltrosUrl('ap')
  const [fondo, setFondo] = useState(searchParams.get('fondoId') ?? '')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const socioId = searchParams.get('socioId')

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select', { estado: undefined }],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100 } })
      return data.data as { id: number; nombre: string; moneda: string }[]
    },
  })

  const { data, isLoading, isError, error, refetch } = useAportes({
    search,
    page,
    limit: 10,
    tipo: tipo || undefined,
    estado: estado || undefined,
    fondoId: fondo ? Number(fondo) : undefined,
    periodo: periodo || undefined,
    socioId: socioId ? Number(socioId) : undefined,
  })
  const deleteMutation = useDeleteAporte()

  const aportes = data?.data || []
  const totalPorMoneda = data?.totalAportadoPorMoneda || {}

  const handleDelete = () => {
    if (deleteId === null) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    })
  }

  const handleImprimirComprobante = async (aporte: Aporte) => {
    try {
      await openProtectedPdf(`/reportes/comprobante-aporte/pdf?aporteId=${aporte.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el comprobante de ingreso'))
    }
  }

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await aportesApi.list({
        search,
        limit: 1000,
        tipo: tipo || undefined,
        estado: estado || undefined,
        fondoId: fondo ? Number(fondo) : undefined,
        periodo: periodo || undefined,
        socioId: socioId ? Number(socioId) : undefined,
      })
      const headers = ['Socio', 'Tipo', 'Monto', 'Periodo', 'Fondo', 'Estado', 'Fecha']
      const filas = result.data.map((a: Aporte) => [
        `${a.socio.nombres} ${a.socio.apellidoPaterno} ${a.socio.apellidoMaterno}`,
        a.tipo,
        a.monto,
        a.periodo,
        a.fondo.nombre,
        a.estado,
        a.fechaAporte,
      ])
      if (formato === 'csv') exportCsv('aportes.csv', headers, filas)
      else exportXlsx('aportes.xlsx', headers, filas)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar aportes'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'socio',
      label: 'Socio',
      render: (a: Aporte) => (
        <Link to={`/socios/${a.socio.id}`} className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(a.socio.codigo)}`}
          >
            {getSocioIniciales(a.socio.nombres, a.socio.apellidoPaterno)}
          </div>
          <div>
            <p className="font-medium text-foreground hover:text-secondary">
              {a.socio.nombres} {a.socio.apellidoPaterno}
            </p>
            <p className="text-xs text-subtle">{a.socio.codigo}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (a: Aporte) => tipoBadge(a.tipo),
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (a: Aporte) => (
        <span className="font-medium text-foreground">{formatMonto(a.monto, a.fondo.moneda)}</span>
      ),
    },
    {
      key: 'periodo',
      label: 'Período',
      render: (a: Aporte) => (
        <span className="flex items-center gap-1 text-sm text-muted">
          <Calendar className="h-3.5 w-3.5 text-subtle" />
          {a.periodo}
        </span>
      ),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (a: Aporte) => (
        <Link to={`/fondos/${a.fondo.id}`} className="text-sm text-muted hover:text-secondary">
          {a.fondo.nombre}
        </Link>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (a: Aporte) =>
        a.estado === 'ANULADO' ? (
          <Badge variant="gray">Anulado</Badge>
        ) : (
          <Badge variant="green">Activo</Badge>
        ),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (a: Aporte) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleImprimirComprobante(a)}
            title="Ver comprobante"
            aria-label="Ver comprobante"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
          >
            <Receipt className="h-4 w-4" />
          </button>
          <Link
            to={`/aportes/${a.id}`}
            aria-label={`Ver aporte ${a.id}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {a.estado === 'ACTIVO' && (
            <button
              onClick={() => setDeleteId(a.id)}
              aria-label={`Anular aporte ${a.id}`}
              title="Anular"
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const desde = (data?.page ?? 1 - 1) * (data?.limit ?? 10) + 1
  const hasta = Math.min((data?.page ?? 1) * (data?.limit ?? 10), data?.total ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Aportes"
          description="Registro de aportes de socios a fondos rotatorios"
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
          <Button as="link" to="/aportes/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Aporte
          </Button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : data?.total || 0}
              </p>
              <p className="text-xs text-muted">Total Aportes</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              {isLoading ? (
                <p className="text-2xl font-bold text-foreground">—</p>
              ) : Object.keys(totalPorMoneda).length > 0 ? (
                Object.entries(totalPorMoneda).map(([moneda, monto]) => (
                  <p key={moneda} className="text-lg font-bold text-foreground">
                    {formatMonto(monto, moneda)}
                  </p>
                ))
              ) : (
                <p className="text-2xl font-bold text-foreground">0.00</p>
              )}
              <p className="text-xs text-muted">Total Aportado</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : data?.totalActivos || 0}
              </p>
              <p className="text-xs text-muted">Aportes Activos</p>
            </div>
          </div>
        </Card>
      </div>

      {data?.porTipo && Object.keys(data.porTipo).length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Por tipo:
          </span>
          {Object.entries(data.porTipo).map(([tipo, info]) => (
            <div
              key={tipo}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5"
            >
              {tipoBadge(tipo)}
              <span className="text-sm font-semibold text-foreground">
                {info.monto.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-muted">({info.cantidad})</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por socio, comprobante o período..."
            value={search}
            onChange={(val) => {
              actualizar({ search: val })
            }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
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

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Select
            value={tipo}
            onChange={(e) => {
              actualizar({ tipo: e.target.value })
            }}
            options={TIPOS}
            placeholder="Todos los tipos"
          />
          <Select
            value={fondo}
            onChange={(e) => {
              setFondo(e.target.value)
              actualizar({ page: 1 })
            }}
            options={[
              { value: '', label: 'Todos los fondos' },
              ...(fondosData || []).map((f) => ({
                value: String(f.id),
                label: `${f.nombre} (${f.moneda})`,
              })),
            ]}
            placeholder="Todos los fondos"
          />
          <Input
            type="month"
            value={periodo}
            onChange={(e) => {
              actualizar({ periodo: e.target.value })
            }}
            placeholder="Período"
            aria-label="Filtrar por período"
          />
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={aportes}
            loading={isLoading}
            keyField="id"
            emptyTitle="No hay aportes registrados"
            emptyDescription="Registra el primer aporte para comenzar."
            emptyActionLabel="Nuevo Aporte"
            emptyActionTo="/aportes/nuevo"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} aportes
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Anular Aporte"
        message="¿Estás seguro de anular este aporte? El capital disponible del fondo se reducirá."
        confirmText="Anular"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
