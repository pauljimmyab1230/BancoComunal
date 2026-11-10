import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Trash2, Pencil } from 'lucide-react'
import { useCajas, useDeleteCaja } from '../hooks/useCajas'
import {
  Button,
  DataTable,
  SearchInput,
  Badge,
  SectionHeader,
  ConfirmDialog,
  ErrorState,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { Caja } from '../types'

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, isError, error, refetch } = useCajas({ search, page, limit: 10 })
  const deleteCaja = useDeleteCaja()

  const columns = [
    {
      key: 'codigo',
      label: 'Código',
      render: (caja: Caja) => <span className="font-mono text-sm font-medium">{caja.codigo}</span>,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (caja: Caja) => (
        <div>
          <div className="font-medium">{caja.nombre}</div>
          <div className="text-xs text-gray-500">{caja.tipo}</div>
        </div>
      ),
    },
    {
      key: 'saldoActual',
      label: 'Saldo Actual',
      render: (caja: Caja) => (
        <span className="font-semibold text-gray-900">{formatCurrency(caja.saldoActual)}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (caja: Caja) => estadoBadge(caja.estado),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (caja: Caja) => (
        <span className="text-sm text-gray-600">{caja.fondo?.nombre || '—'}</span>
      ),
    },
    {
      key: '_count',
      label: 'Movimientos',
      render: (caja: Caja) => (
        <span className="text-sm text-gray-600">{caja._count?.movimientos || 0}</span>
      ),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (caja: Caja) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/caja/${caja.id}`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/caja/${caja.id}/editar`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-secondary/10 hover:text-secondary"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(caja.id)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Cajas" description="Administración de cajas del sistema" />
        <Button as="link" to="/caja/nueva" iconLeft={<Plus className="h-4 w-4" />}>
          Nueva Caja
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          className="max-w-md"
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
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
          onPageChange={setPage}
        />
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
      />
    </div>
  )
}
