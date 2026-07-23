import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Eye, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSocios, useDeleteSocio } from '../hooks/useSocios'
import { socioApi } from '../api/socioApi'
import { Button, DataTable, SearchInput, Badge, SectionHeader, ConfirmDialog, Select } from '@/components/ui'
import type { Socio } from '../types'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'A':
      return <Badge variant="green">Activo</Badge>
    case 'I':
      return <Badge variant="gray">Inactivo</Badge>
    default:
      return <Badge>{estado}</Badge>
  }
}

export default function SociosListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [estadoFilter, setEstadoFilter] = useState('')

  const { data, isLoading } = useSocios({ search, page, limit: 10, estado: estadoFilter || undefined })
  const deleteMutation = useDeleteSocio()

  const handleExportCsv = async () => {
    try {
      const result = await socioApi.list({ search, limit: 1000, estado: estadoFilter || undefined })
      const headers = ['Código', 'DNI', 'Nombres', 'Teléfono', 'Email', 'Estado', 'Fecha Ingreso']
      const rows = result.data.map((s: Socio) => [
        s.codigo, s.dni, s.nombreCompleto, s.telefono || '', s.email || '',
        s.estado === 'A' ? 'Activo' : 'Inactivo', s.fechaIngreso,
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'socios.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar socios')
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
      sortable: true,
      render: (socio: Socio) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-sm font-semibold text-[#2563EB]">
            {socio.nombres.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[#111827]">{socio.nombreCompleto}</p>
            <p className="text-xs text-gray-500">{socio.email || '—'}</p>
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
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (socio: Socio) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/socios/${socio.id}`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/socios/${socio.id}/editar`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDeleteId(socio.id)}
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
        <SectionHeader
          title="Socios"
          description="Administración de socios de la organización"
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCsv} iconLeft={<Download className="h-4 w-4" />}>
            Exportar CSV
          </Button>
          <Button as="link" to="/socios/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Socio
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput
            placeholder="Buscar por código, DNI o nombres..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(1) }}
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500">Estado</label>
          <Select
            options={[
              { value: '', label: 'Todos' },
              { value: 'A', label: 'Activos' },
              { value: 'I', label: 'Inactivos' },
            ]}
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(1) }}
          />
        </div>
      </div>

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
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) deleteMutation.mutate(deleteId)
          setDeleteId(null)
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
