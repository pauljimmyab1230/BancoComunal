import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  Download,
  Users,
  UserCheck,
  UserX,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSocios, useDeleteSocio } from '../hooks/useSocios'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { socioApi } from '../api/socioApi'
import { getErrorMessage } from '@/lib/api'
import { exportCsv, exportXlsx, getSocioIniciales, getClaseAvatar } from '@/lib/utils'
import {
  Button,
  DataTable,
  SearchInput,
  Badge,
  SectionHeader,
  ConfirmDialog,
  ErrorState,
  Card,
} from '@/components/ui'
import type { Socio } from '../types'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'A':
      return <Badge variant="green">Activo</Badge>
    case 'I':
      return <Badge variant="red">Inactivo</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'A', label: 'Activos' },
  { value: 'I', label: 'Inactivos' },
]

export default function SociosListPage() {
  const { search, page, estado: estadoFilter, actualizar } = useFiltrosUrl('s')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, error, refetch } = useSocios({
    search,
    page,
    limit: 10,
    estado: estadoFilter || undefined,
  })
  const { data: statsTotal } = useSocios({ limit: 1 })
  const { data: statsActivos } = useSocios({ estado: 'A', limit: 1 })
  const deleteMutation = useDeleteSocio()

  const total = statsTotal?.total ?? 0
  const activos = statsActivos?.total ?? 0
  const inactivos = total - activos

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const construirFilas = (lista: Socio[]) =>
    lista.map((s) => [
      s.codigo,
      s.dni,
      s.nombreCompleto,
      s.telefono || '',
      s.email || '',
      s.estado === 'A' ? 'Activo' : 'Inactivo',
      s.fechaIngreso,
    ])

  const headers = ['Codigo', 'DNI', 'Nombres', 'Telefono', 'Email', 'Estado', 'Fecha Ingreso']

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await socioApi.list({ search, limit: 1000, estado: estadoFilter || undefined })
      const filas = construirFilas(result.data)
      if (formato === 'csv') exportCsv('socios.csv', headers, filas)
      else exportXlsx('socios.xlsx', headers, filas)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar socios'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'codigo',
      label: 'Código',
      className: 'font-medium',
    },
    {
      key: 'dni',
      label: 'DNI',
    },
    {
      key: 'nombreCompleto',
      label: 'Nombres',
      render: (socio: Socio) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getClaseAvatar(socio.codigo)}`}
          >
            {getSocioIniciales(socio.nombres, socio.apellidoPaterno)}
          </div>
          <div>
            <p className="font-medium text-foreground">{socio.nombreCompleto}</p>
            <p className="text-xs text-muted">{socio.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (socio: Socio) => socio.telefono || '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (socio: Socio) => estadoBadge(socio.estado),
    },
    {
      key: 'fechaIngreso',
      label: 'Ingreso',
      render: (socio: Socio) =>
        socio.fechaIngreso ? new Date(socio.fechaIngreso).toLocaleDateString('es-PE') : '—',
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (socio: Socio) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/socios/${socio.id}`}
            aria-label={`Ver socio ${socio.nombreCompleto}`}
            title="Ver detalle"
            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/socios/${socio.id}/editar`}
            aria-label={`Editar socio ${socio.nombreCompleto}`}
            title="Editar"
            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(socio.id)}
            aria-label={`Eliminar socio ${socio.nombreCompleto}`}
            title="Eliminar"
            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
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
        <SectionHeader title="Socios" description="Administración de socios de la organización" />
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
          <Button as="link" to="/socios/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Socio
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <ResumenTarjeta
          icono={Users}
          label="Total de socios"
          valor={total}
          claseIcono="bg-secondary/12 text-secondary"
        />
        <ResumenTarjeta
          icono={UserCheck}
          label="Activos"
          valor={activos}
          claseIcono="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <ResumenTarjeta
          icono={UserX}
          label="Inactivos"
          valor={inactivos}
          claseIcono="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput
            aria-label="Buscar socios por código, DNI o nombres"
            placeholder="Buscar por código, DNI o nombres..."
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
            data={data?.data || []}
            loading={isLoading}
            keyField="id"
            emptyTitle="No hay socios registrados"
            emptyDescription="Comienza registrando el primer socio de la organización."
            emptyActionLabel="Registrar Socio"
            emptyActionTo="/socios/nuevo"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} socios
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) {
            deleteMutation.mutate(deleteId, {
              onSettled: () => setDeleteId(null),
            })
          }
        }}
        title="Eliminar Socio"
        message="¿Estás seguro de eliminar este socio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function ResumenTarjeta({
  icono: Icono,
  label,
  valor,
  claseIcono,
}: {
  icono: React.ComponentType<{ className?: string }>
  label: string
  valor: number
  claseIcono: string
}) {
  return (
    <Card padding="sm" hover={false}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${claseIcono}`}
        >
          <Icono className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold text-foreground">{valor}</p>
        </div>
      </div>
    </Card>
  )
}
