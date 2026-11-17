import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Eye,
  Trash2,
  Pencil,
  Wallet,
  Building2,
  ArrowLeftRight,
  ClipboardCheck,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import { useCajas, useDeleteCaja, useResumenGeneralCaja } from '../hooks/useCajas'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { cajaApi } from '../api/cajaApi'
import {
  Button,
  DataTable,
  SearchInput,
  Badge,
  SectionHeader,
  Card,
  ConfirmDialog,
  Select,
  ErrorState,
} from '@/components/ui'
import { formatCurrency, exportCsv, exportXlsx } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Caja } from '../types'

const FILTROS_ESTADO = [
  { value: '', label: 'Todas' },
  { value: 'ACTIVA', label: 'Activas' },
  { value: 'INACTIVA', label: 'Inactivas' },
  { value: 'CERRADA', label: 'Cerradas' },
]

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'SECUNDARIA', label: 'Secundaria' },
  { value: 'CAJA_CHICA', label: 'Caja Chica' },
]

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'PRINCIPAL':
      return <Badge variant="blue">Principal</Badge>
    case 'SECUNDARIA':
      return <Badge variant="purple">Secundaria</Badge>
    case 'CAJA_CHICA':
      return <Badge variant="yellow">Caja Chica</Badge>
    default:
      return <Badge>{tipo}</Badge>
  }
}

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVA':
      return <Badge variant="green">Activa</Badge>
    case 'INACTIVA':
      return <Badge variant="gray">Inactiva</Badge>
    case 'CERRADA':
      return <Badge variant="red">Cerrada</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

export default function CajaListPage() {
  const { search, page, estado, tipo, actualizar } = useFiltrosUrl('cj')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, error, refetch } = useCajas({
    search,
    page,
    limit: 10,
    estado: estado || undefined,
    tipo: tipo || undefined,
  })
  const { data: resumen, isLoading: loadingResumen } = useResumenGeneralCaja()
  const deleteCaja = useDeleteCaja()

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await cajaApi.list({
        search,
        limit: 1000,
        estado: estado || undefined,
        tipo: tipo || undefined,
      })
      const headers = [
        'Código',
        'Nombre',
        'Tipo',
        'Moneda',
        'Fondo',
        'Saldo inicial',
        'Saldo actual',
        'Estado',
        'Movimientos',
      ]
      const filas = result.data.map((caja: Caja) => [
        caja.codigo,
        caja.nombre,
        caja.tipo,
        caja.moneda,
        caja.fondo?.nombre || '',
        caja.saldoInicial,
        caja.saldoActual,
        caja.estado,
        caja.totalMovimientos ?? caja._count?.movimientos ?? 0,
      ])
      if (formato === 'csv') exportCsv('cajas.csv', headers, filas)
      else exportXlsx('cajas.xlsx', headers, filas)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al exportar las cajas'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Caja',
      render: (caja: Caja) => (
        <Link to={`/caja/${caja.id}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground hover:text-secondary">{caja.nombre}</p>
            <p className="font-mono text-xs text-subtle">{caja.codigo}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (caja: Caja) => tipoBadge(caja.tipo),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (caja: Caja) =>
        caja.fondo ? (
          <Link
            to={`/fondos/${caja.fondo.id}`}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-secondary"
          >
            <Building2 className="h-3.5 w-3.5 text-subtle" />
            {caja.fondo.nombre}
          </Link>
        ) : (
          <span className="text-sm text-subtle">—</span>
        ),
    },
    {
      key: 'saldoActual',
      label: 'Saldo actual',
      render: (caja: Caja) => (
        <div>
          <span className="font-semibold text-foreground">
            {formatCurrency(caja.saldoActual, caja.moneda)}
          </span>
          <p className="text-xs text-subtle">
            Inicial: {formatCurrency(caja.saldoInicial, caja.moneda)}
          </p>
        </div>
      ),
    },
    {
      key: 'totalMovimientos',
      label: 'Movimientos',
      render: (caja: Caja) => (
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <ArrowLeftRight className="h-3.5 w-3.5 text-subtle" />
          {caja.totalMovimientos ?? caja._count?.movimientos ?? 0}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (caja: Caja) => estadoBadge(caja.estado),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (caja: Caja) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/caja/${caja.id}`}
            aria-label={`Ver caja ${caja.nombre}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/caja/${caja.id}/editar`}
            aria-label={`Editar caja ${caja.nombre}`}
            title="Editar"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(caja.id)}
            aria-label={`Eliminar caja ${caja.nombre}`}
            title="Eliminar"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const saldos = resumen?.saldosPorMoneda ?? {}
  const desde = ((data?.page ?? 1) - 1) * (data?.limit ?? 10) + 1
  const hasta = Math.min((data?.page ?? 1) * (data?.limit ?? 10), data?.total ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Cajas"
          description="Administración de las cajas y su saldo en tiempo real"
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
          <Button as="link" to="/caja/nueva" iconLeft={<Plus className="h-4 w-4" />}>
            Nueva Caja
          </Button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              {loadingResumen ? (
                <p className="text-2xl font-bold text-foreground">—</p>
              ) : Object.keys(saldos).length > 0 ? (
                Object.entries(saldos).map(([moneda, monto]) => (
                  <p key={moneda} className="truncate text-lg font-bold text-foreground">
                    {formatCurrency(monto, moneda)}
                  </p>
                ))
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatCurrency(0)}</p>
              )}
              <p className="text-xs text-muted">
                Saldo total{Object.keys(saldos).length > 1 ? ' (por moneda)' : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loadingResumen ? '—' : (resumen?.cajasActivas ?? 0)}
              </p>
              <p className="text-xs text-muted">Cajas activas de {resumen?.totalCajas ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loadingResumen ? '—' : (resumen?.hoy.movimientos ?? 0)}
              </p>
              <p className="text-xs text-muted">Movimientos hoy</p>
              {!loadingResumen &&
                (Object.keys(resumen?.hoyPorMoneda ?? {}).length > 0 ? (
                  Object.entries(resumen?.hoyPorMoneda ?? {}).map(([moneda, valores]) => (
                    <p key={moneda} className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpCircle className="h-3 w-3" />
                        {formatCurrency(valores.ingresos, moneda)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <ArrowDownCircle className="h-3 w-3" />
                        {formatCurrency(valores.egresos, moneda)}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="mt-1 text-xs text-subtle">Sin movimientos hoy</p>
                ))}
            </div>
          </div>
        </Card>

        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loadingResumen ? '—' : (resumen?.arqueosPendientes ?? 0)}
              </p>
              <p className="text-xs text-muted">Arqueos pendientes</p>
              <p className="mt-1 text-xs text-subtle">
                {resumen?.flujoProximos ?? 0} movimientos proyectados
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(val) => {
              actualizar({ search: val })
            }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {FILTROS_ESTADO.map((filtro) => (
            <button
              key={filtro.value}
              type="button"
              onClick={() => {
                actualizar({ estado: filtro.value })
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                estado === filtro.value
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        <Select
          value={tipo}
          onChange={(e) => {
            actualizar({ tipo: e.target.value })
          }}
          options={TIPOS}
          placeholder="Todos los tipos"
          className="w-48"
        />
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
            emptyTitle="No hay cajas registradas"
            emptyDescription="Comienza registrando la primera caja del sistema."
            emptyActionLabel="Nueva Caja"
            emptyActionTo="/caja/nueva"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} cajas
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteCaja.mutate(deleteId)
            setDeleteId(null)
          }
        }}
        title="Eliminar Caja"
        message="¿Estás seguro de eliminar esta caja? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleteCaja.isPending}
      />
    </div>
  )
}
