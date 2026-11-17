import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Banknote,
  Wallet,
  Calendar,
  Eye,
  Trash2,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  HandCoins,
  AlertTriangle,
  Calculator,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCreditos, useAnularCredito } from '../hooks/useCreditos'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { creditosApi } from '../api/creditosApi'
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
import api from '@/lib/api'
import { getErrorMessage } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar, exportCsv, exportXlsx } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Prestamo } from '../types'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO':
      return <Badge variant="blue">Activo</Badge>
    case 'PAGADO':
      return <Badge variant="green">Pagado</Badge>
    case 'ANULADO':
      return <Badge variant="gray">Anulado</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'PAGADO', label: 'Pagados' },
  { value: 'ANULADO', label: 'Anulados' },
]

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function CreditosListPage() {
  const [searchParams] = useSearchParams()
  const { search, page, estado, actualizar } = useFiltrosUrl('cr')
  const [fondo, setFondo] = useState(searchParams.get('fondoId') ?? '')
  const [anularId, setAnularId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const socioId = searchParams.get('socioId') ? Number(searchParams.get('socioId')) : undefined

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const { data, isLoading, isError, error, refetch } = useCreditos({
    search,
    page,
    limit: 10,
    socioId,
    fondoId: fondo ? Number(fondo) : undefined,
    estado: estado || undefined,
  })
  const anularMutation = useAnularCredito()

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select', { estado: undefined }],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100 } })
      return data.data as { id: number; nombre: string; moneda: string }[]
    },
  })

  const creditos = data?.data || []
  const totalPrestadoPorMoneda = data?.totalPrestadoPorMoneda || {}
  const saldoPorCobrarPorMoneda = data?.saldoPorCobrarPorMoneda || {}

  const handleAnular = () => {
    if (!anularId) return
    anularMutation.mutate(anularId, { onSettled: () => setAnularId(null) })
  }

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const result = await creditosApi.list({
        search,
        limit: 1000,
        socioId,
        fondoId: fondo ? Number(fondo) : undefined,
        estado: estado || undefined,
      })
      const headers = ['Socio', 'Monto', 'Cuotas', 'Tasa', 'Fondo', 'Estado', 'Desembolso']
      const filas = result.data.map((p: Prestamo) => [
        `${p.socio.nombres} ${p.socio.apellidoPaterno} ${p.socio.apellidoMaterno}`,
        p.monto,
        p.numeroCuotas,
        `${p.tasaInteres}%`,
        p.fondo.nombre,
        p.estado,
        p.fechaDesembolso,
      ])
      if (formato === 'csv') exportCsv('creditos.csv', headers, filas)
      else exportXlsx('creditos.xlsx', headers, filas)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar créditos'))
    } finally {
      setExportOpen(false)
    }
  }

  const columns = [
    {
      key: 'socio',
      label: 'Socio',
      render: (p: Prestamo) => (
        <Link to={`/socios/${p.socio.id}`} className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(p.socio.codigo)}`}
          >
            {getSocioIniciales(p.socio.nombres, p.socio.apellidoPaterno)}
          </div>
          <div>
            <p className="font-medium text-foreground hover:text-secondary">
              {p.socio.nombres} {p.socio.apellidoPaterno}
            </p>
            <p className="text-xs text-subtle">{p.socio.codigo}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (p: Prestamo) => (
        <span className="font-medium text-foreground">{formatMonto(p.monto, p.fondo.moneda)}</span>
      ),
    },
    {
      key: 'cuotas',
      label: 'Cuotas',
      render: (p: Prestamo) => {
        const pagadas = p.cuotasPagadas ?? 0
        const total = p.totalCuotas ?? p.numeroCuotas
        const pct = total > 0 ? (pagadas / total) * 100 : 0
        return (
          <div className="min-w-[120px]">
            <span className="text-sm text-muted">
              {pagadas}/{total} × {formatMonto(p.montoCuota, p.fondo.moneda)}
            </span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'interes',
      label: 'Interés',
      render: (p: Prestamo) => <span className="text-sm text-muted">{p.tasaInteres}%</span>,
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (p: Prestamo) => (
        <Link to={`/fondos/${p.fondo.id}`} className="text-sm text-muted hover:text-secondary">
          {p.fondo.nombre}
        </Link>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p: Prestamo) => (
        <div className="flex items-center gap-2">
          {estadoBadge(p.estado)}
          {p.estado === 'ACTIVO' && (p.cuotasVencidas ?? 0) > 0 && (
            <Badge variant="red">En mora</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (p: Prestamo) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/creditos/${p.id}`}
            aria-label={`Ver crédito ${p.id}`}
            title="Ver detalle"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {p.estado === 'ACTIVO' && (
            <button
              onClick={() => setAnularId(p.id)}
              aria-label={`Anular crédito ${p.id}`}
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
        <SectionHeader title="Créditos" description="Gestión de préstamos y cuotas" />
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
          <Button
            as="link"
            to="/cotizaciones/nueva"
            variant="secondary"
            iconLeft={<Calculator className="h-4 w-4" />}
          >
            Cotizar
          </Button>
          <Button as="link" to="/creditos/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Crédito
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : data?.total || 0}
              </p>
              <p className="text-xs text-muted">Total Créditos</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              {Object.keys(totalPrestadoPorMoneda).length === 0 ? (
                <p className="text-2xl font-bold text-foreground">—</p>
              ) : (
                <div className="space-y-0.5">
                  {Object.entries(totalPrestadoPorMoneda).map(([moneda, monto]) => (
                    <p
                      key={moneda}
                      className={
                        Object.keys(totalPrestadoPorMoneda).length === 1
                          ? 'text-2xl font-bold text-foreground'
                          : 'text-lg font-bold text-foreground'
                      }
                    >
                      {formatMonto(monto, moneda)}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted">Total Prestado (activos)</p>
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
              <p className="text-xs text-muted">Créditos Activos</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
              <HandCoins className="h-6 w-6" />
            </div>
            <div>
              {Object.keys(saldoPorCobrarPorMoneda).length === 0 ? (
                <p className="text-2xl font-bold text-foreground">—</p>
              ) : (
                <div className="space-y-0.5">
                  {Object.entries(saldoPorCobrarPorMoneda).map(([moneda, monto]) => (
                    <p
                      key={moneda}
                      className={
                        Object.keys(saldoPorCobrarPorMoneda).length === 1
                          ? 'text-2xl font-bold text-foreground'
                          : 'text-lg font-bold text-foreground'
                      }
                    >
                      {formatMonto(monto, moneda)}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted">Saldo por Cobrar</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : data?.totalEnMora || 0}
              </p>
              <p className="text-xs text-muted">En Mora (cuotas vencidas)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por socio..."
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

        <Select
          value={fondo}
          onChange={(e) => {
            setFondo(e.target.value)
            actualizar({ page: 1 })
          }}
          options={[
            { value: '', label: 'Todos los fondos' },
            ...(fondosData || []).map((f) => ({ value: String(f.id), label: f.nombre })),
          ]}
          className="w-56"
          placeholder="Todos los fondos"
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={creditos}
            loading={isLoading}
            keyField="id"
            emptyTitle="No hay créditos registrados"
            emptyDescription="Registra el primer crédito para comenzar."
            emptyActionLabel="Nuevo Crédito"
            emptyActionTo="/creditos/nuevo"
            currentPage={data?.page}
            totalPages={data?.totalPages}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} créditos
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={anularId !== null}
        onClose={() => setAnularId(null)}
        onConfirm={handleAnular}
        title="Anular Crédito"
        message="¿Estás seguro de anular este crédito? El capital será restituido al fondo. Solo se puede anular si no tiene cuotas pagadas."
        confirmText="Anular"
        variant="danger"
        loading={anularMutation.isPending}
      />
    </div>
  )
}
