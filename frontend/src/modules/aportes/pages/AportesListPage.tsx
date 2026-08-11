import { useState } from 'react'
import { Plus, Eye, Trash2, Banknote, Wallet, Calendar, Receipt } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAportes, useDeleteAporte } from '../hooks/useAportes'
import { Button, DataTable, SearchInput, Badge, SectionHeader, Card, ConfirmDialog, Select, Input } from '@/components/ui'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { openProtectedPdf, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Aporte } from '../types'

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'OBLIGATORIO', label: 'Obligatorio' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' },
  { value: 'VOLUNTARIO', label: 'Voluntario' },
  { value: 'MULTA', label: 'Multa' },
]

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'ANULADO', label: 'Anulado' },
]

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'OBLIGATORIO': return <Badge variant="blue">Obligatorio</Badge>
    case 'EXTRAORDINARIO': return <Badge variant="purple">Extraordinario</Badge>
    case 'VOLUNTARIO': return <Badge variant="green">Voluntario</Badge>
    case 'MULTA': return <Badge variant="red">Multa</Badge>
    default: return <Badge>{tipo}</Badge>
  }
}

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function AportesListPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState('')
  const [fondo, setFondo] = useState(searchParams.get('fondoId') ?? '')
  const [periodo, setPeriodo] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const socioId = searchParams.get('socioId')

  const { data: fondosData } = useQuery({
    queryKey: ['fondos-select'],
    queryFn: async () => {
      const { data } = await api.get('/fondos', { params: { limit: 100 } })
      return data.data as { id: number; nombre: string; moneda: string }[]
    },
  })

  const { data, isLoading } = useAportes({
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

  const columns = [
    {
      key: 'socio',
      label: 'Socio',
      render: (a: Aporte) => (
        <Link to={`/socios/${a.socio.id}`} className="flex items-center gap-2 text-sm hover:text-[#2563EB]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
            {a.socio.nombres.charAt(0)}{a.socio.apellidoPaterno.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[#111827]">{a.socio.nombres} {a.socio.apellidoPaterno}</p>
            <p className="text-xs text-gray-400">{a.socio.codigo}</p>
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
        <span className="font-medium">{formatMonto(a.monto, a.fondo.moneda)}</span>
      ),
    },
    {
      key: 'periodo',
      label: 'Período',
      render: (a: Aporte) => (
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {a.periodo}
        </span>
      ),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (a: Aporte) => (
        <Link to={`/fondos/${a.fondo.id}`} className="text-sm text-gray-600 hover:text-[#2563EB]">
          {a.fondo.nombre}
        </Link>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (a: Aporte) => (
        a.estado === 'ANULADO'
          ? <Badge variant="gray">Anulado</Badge>
          : <Badge variant="green">Activo</Badge>
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
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Receipt className="h-4 w-4" />
          </button>
          <Link to={`/aportes/${a.id}`} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]">
            <Eye className="h-4 w-4" />
          </Link>
          {a.estado === 'ACTIVO' && (
            <button onClick={() => setDeleteId(a.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

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

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Aportes"
          description="Registro de aportes de socios a fondos rotatorios"
        />
        <Button as="link" to="/aportes/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
          Nuevo Aporte
        </Button>
      </div>

      {/* Cards resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : (data?.total || 0)}</p>
              <p className="text-xs text-gray-500">Total Aportes</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              {isLoading ? (
                <p className="text-2xl font-bold text-[#111827]">—</p>
              ) : (
                Object.keys(totalPorMoneda).length > 0 ? (
                  Object.entries(totalPorMoneda).map(([moneda, monto]) => (
                    <p key={moneda} className="text-lg font-bold text-[#111827]">{formatMonto(monto, moneda)}</p>
                  ))
                ) : (
                  <p className="text-2xl font-bold text-[#111827]">0.00</p>
                )
              )}
              <p className="text-xs text-gray-500">Total Aportado</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : (data?.totalActivos || 0)}</p>
              <p className="text-xs text-gray-500">Aportes Activos</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          placeholder="Buscar por socio, comprobante o período..."
          value={search}
          onChange={(val) => { setSearch(val); setPage(1) }}
          className="w-full max-w-md"
        />
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setPage(1) }}
            options={TIPOS}
            placeholder="Todos los tipos"
          />
          <Select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1) }}
            options={ESTADOS}
            placeholder="Todos los estados"
          />
          <Select
            value={fondo}
            onChange={(e) => { setFondo(e.target.value); setPage(1) }}
            options={[
              { value: '', label: 'Todos los fondos' },
              ...(fondosData || []).map((f) => ({ value: String(f.id), label: `${f.nombre} (${f.moneda})` })),
            ]}
            placeholder="Todos los fondos"
          />
          <Input
            type="month"
            value={periodo}
            onChange={(e) => { setPeriodo(e.target.value); setPage(1) }}
            placeholder="Período"
          />
        </div>
      </div>

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
        onPageChange={setPage}
      />

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
