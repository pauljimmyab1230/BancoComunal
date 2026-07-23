import { useState } from 'react'
import { Plus, Banknote, Wallet, Calendar, Eye, Trash2 } from 'lucide-react'
import { useCreditos, useAnularCredito } from '../hooks/useCreditos'
import { Button, DataTable, SearchInput, Badge, SectionHeader, Card, ConfirmDialog } from '@/components/ui'
import { Link } from 'react-router-dom'
import type { Prestamo } from '../types'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO': return <Badge variant="blue">Activo</Badge>
    case 'PAGADO': return <Badge variant="green">Pagado</Badge>
    case 'ANULADO': return <Badge variant="gray">Anulado</Badge>
    case 'PENDIENTE': return <Badge variant="yellow">Pendiente</Badge>
    default: return <Badge>{estado}</Badge>
  }
}

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function CreditosListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [anularId, setAnularId] = useState<number | null>(null)

  const { data, isLoading } = useCreditos({ search, page, limit: 10 })
  const anularMutation = useAnularCredito()

  const creditos = data?.data || []

  const columns = [
    {
      key: 'socio',
      label: 'Socio',
      render: (p: Prestamo) => (
        <Link to={`/socios/${p.socio.id}`} className="flex items-center gap-2 text-sm hover:text-[#2563EB]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
            {p.socio.nombres.charAt(0)}{p.socio.apellidoPaterno.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[#111827]">{p.socio.nombres} {p.socio.apellidoPaterno}</p>
            <p className="text-xs text-gray-400">{p.socio.codigo}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (p: Prestamo) => (
        <span className="font-medium">{formatMonto(p.monto, p.fondo.moneda)}</span>
      ),
    },
    {
      key: 'cuotas',
      label: 'Cuotas',
      render: (p: Prestamo) => (
        <span className="text-sm text-gray-600">
          {p.totalCuotas || p.numeroCuotas} × {formatMonto(p.montoCuota)}
        </span>
      ),
    },
    {
      key: 'interes',
      label: 'Interés',
      render: (p: Prestamo) => (
        <span className="text-sm text-gray-600">{p.tasaInteres}%</span>
      ),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (p: Prestamo) => (
        <Link to={`/fondos/${p.fondo.id}`} className="text-sm text-gray-600 hover:text-[#2563EB]">
          {p.fondo.nombre}
        </Link>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p: Prestamo) => estadoBadge(p.estado),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (p: Prestamo) => (
        <div className="flex justify-end gap-1">
          <Link to={`/creditos/${p.id}`} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]">
            <Eye className="h-4 w-4" />
          </Link>
          {p.estado === 'ACTIVO' && (
            <button onClick={() => setAnularId(p.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const handleAnular = () => {
    if (!anularId) return
    anularMutation.mutate(anularId)
    setAnularId(null)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Créditos"
          description="Gestión de préstamos y cuotas"
        />
        <Button as="link" to="/creditos/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
          Nuevo Crédito
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : (data?.total || 0)}</p>
              <p className="text-xs text-gray-500">Total Créditos</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">
                {isLoading ? '—' : formatMonto((data as any)?.totalPrestado || 0)}
              </p>
              <p className="text-xs text-gray-500">Total Prestado</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : ((data as any)?.totalActivos || 0)}</p>
              <p className="text-xs text-gray-500">Créditos Activos</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por socio..."
          value={search}
          onChange={(val) => { setSearch(val); setPage(1) }}
          className="max-w-md"
        />
      </div>

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
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={anularId !== null}
        onClose={() => setAnularId(null)}
        onConfirm={handleAnular}
        title="Anular Crédito"
        message="¿Estás seguro de anular este crédito? El capital será restituido al fondo. Solo se puede anular si no tiene cuotas pagadas."
        confirmText="Anular"
        variant="danger"
      />
    </div>
  )
}
