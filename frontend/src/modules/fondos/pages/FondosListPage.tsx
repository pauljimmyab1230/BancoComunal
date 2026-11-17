import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Building2,
  Users,
  Wallet,
  Eye,
  Pencil,
  Trash2,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { useFondos, useDeleteFondo } from '../hooks/useFondos'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
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
import { fondosApi } from '../api/fondosApi'
import { getErrorMessage } from '@/lib/api'
import { exportCsv, exportXlsx } from '@/lib/utils'
import type { FondoRotatorio } from '../types'
import toast from 'react-hot-toast'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO':
      return <Badge variant="green">Activo</Badge>
    case 'INACTIVO':
      return <Badge variant="yellow">Inactivo</Badge>
    case 'CERRADO':
      return <Badge variant="gray">Cerrado</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

const formatMonto = (monto: number, moneda: string) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
  { value: 'CERRADO', label: 'Cerrados' },
]

export default function FondosListPage() {
  const { search, page, estado: estadoFilter, actualizar } = useFiltrosUrl('f')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, error, refetch } = useFondos({
    search,
    page,
    limit: 10,
    estado: estadoFilter || undefined,
  })
  const deleteMutation = useDeleteFondo()

  const fondos = data?.data || []

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const headers = [
    'Nombre',
    'Organizacion',
    'Moneda',
    'Capital Inicial',
    'Disponible',
    'Estado',
    'N socios',
  ]

  const construirFilas = (lista: FondoRotatorio[]) =>
    lista.map((f) => [
      f.nombre,
      f.organizacion || '',
      f.moneda,
      f.capitalInicial,
      f.capitalDisponible,
      f.estado,
      f.totalSocios,
    ])

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await fondosApi.list({
        search,
        limit: 1000,
        estado: estadoFilter || undefined,
      })
      const filas = construirFilas(result.data)
      if (formato === 'csv') exportCsv('fondos.csv', headers, filas)
      else exportXlsx('fondos.xlsx', headers, filas)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar fondos'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Fondo',
      render: (f: FondoRotatorio) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{f.nombre}</p>
            <p className="text-xs text-muted">{f.organizacion || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'capitalInicial',
      label: 'Capital Inicial',
      render: (f: FondoRotatorio) => (
        <span className="font-medium text-foreground">
          {formatMonto(f.capitalInicial, f.moneda)}
        </span>
      ),
    },
    {
      key: 'capitalDisponible',
      label: 'Disponible',
      render: (f: FondoRotatorio) => {
        const pctDisponible =
          f.capitalInicial > 0 ? (f.capitalDisponible / f.capitalInicial) * 100 : 0
        const bajo = f.capitalDisponible < f.capitalInicial * 0.3
        return (
          <div className="min-w-[120px]">
            <span
              className={`font-medium ${
                bajo
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatMonto(f.capitalDisponible, f.moneda)}
            </span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className={`h-full rounded-full ${bajo ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(Math.max(pctDisponible, 0), 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'totalSocios',
      label: 'Socios',
      render: (f: FondoRotatorio) => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Users className="h-3.5 w-3.5 text-subtle" />
          {f.totalSocios}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (f: FondoRotatorio) => estadoBadge(f.estado),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (f: FondoRotatorio) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/fondos/${f.id}`}
            aria-label={`Ver fondo ${f.nombre}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/fondos/${f.id}/editar`}
            aria-label={`Editar fondo ${f.nombre}`}
            title="Editar"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(f.id)}
            aria-label={`Eliminar fondo ${f.nombre}`}
            title="Eliminar"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
          title="Fondos Rotatorios"
          description="Administración de fondos de la organización"
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
          <Button as="link" to="/fondos/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Fondo
          </Button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.total || 0}</p>
              <p className="text-xs text-muted">Total Fondos</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              {data?.capitalResumen?.length ? (
                <div className="space-y-0.5">
                  {data.capitalResumen.map((r) => (
                    <p key={r.moneda} className="text-lg font-bold text-foreground">
                      {formatMonto(r.capitalDisponible, r.moneda)}
                      <span className="text-xs font-normal text-muted">
                        {' '}
                        {r.moneda === 'PEN' ? 'soles' : 'dólares'}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold text-foreground">0</p>
              )}
              <p className="text-xs text-muted">Capital Disponible Total</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.totalSocios || 0}</p>
              <p className="text-xs text-muted">Socios en Fondos (activos)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por nombre de fondo u organización..."
            value={search}
            onChange={(val) => {
              actualizar({ search: val })
            }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                actualizar({ estado: f.value })
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                estadoFilter === f.value
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
            data={fondos}
            loading={isLoading}
            keyField="id"
            emptyTitle="No hay fondos rotatorios"
            emptyDescription="Crea tu primer fondo rotatorio para empezar a administrar."
            emptyActionLabel="Crear Fondo"
            emptyActionTo="/fondos/nuevo"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} fondos
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) deleteMutation.mutate(deleteId)
          setDeleteId(null)
        }}
        title="Eliminar Fondo"
        message="¿Estás seguro de eliminar este fondo? No se podrá eliminar si tiene socios asignados, préstamos activos, aportes o cajas registradas."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
