import { useState } from 'react'
import { Plus, Building2, Users, Wallet, Eye, Pencil, Trash2, Download } from 'lucide-react'
import { useFondos, useDeleteFondo } from '../hooks/useFondos'
import { Button, DataTable, SearchInput, Badge, SectionHeader, Card, ConfirmDialog, Select } from '@/components/ui'
import { Link } from 'react-router-dom'
import { fondosApi } from '../api/fondosApi'
import { getErrorMessage } from '@/lib/api'
import type { FondoRotatorio } from '../types'
import toast from 'react-hot-toast'

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'ACTIVO': return <Badge variant="green">Activo</Badge>
    case 'INACTIVO': return <Badge variant="yellow">Inactivo</Badge>
    case 'CERRADO': return <Badge variant="gray">Cerrado</Badge>
    default: return <Badge>{estado}</Badge>
  }
}

const formatMonto = (monto: number, moneda: string) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function FondosListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useFondos({ search, page, limit: 10, estado: estadoFilter || undefined })
  const deleteMutation = useDeleteFondo()

  // Vista de tarjetas para el dashboard rápido
  const fondos = data?.data || []

  const handleExportCsv = async () => {
    try {
      const result = await fondosApi.list({ search, limit: 1000, estado: estadoFilter || undefined })
      const headers = ['Nombre', 'Organización', 'Moneda', 'Capital Inicial', 'Disponible', 'Estado', 'N° Socios']
      const rows = result.data.map((f: FondoRotatorio) => [
        f.nombre, f.organizacion || '', f.moneda, f.capitalInicial, f.capitalDisponible, f.estado, f.totalSocios,
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'fondos.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar fondos'))
    }
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Fondo',
      render: (f: FondoRotatorio) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-[#111827]">{f.nombre}</p>
            <p className="text-xs text-gray-500">{f.organizacion || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'capitalInicial',
      label: 'Capital Inicial',
      render: (f: FondoRotatorio) => (
        <span className="font-medium">{formatMonto(f.capitalInicial, f.moneda)}</span>
      ),
    },
    {
      key: 'capitalDisponible',
      label: 'Disponible',
      render: (f: FondoRotatorio) => (
        <span className={`font-medium ${f.capitalDisponible < f.capitalInicial * 0.3 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {formatMonto(f.capitalDisponible, f.moneda)}
        </span>
      ),
    },
    {
      key: 'totalSocios',
      label: 'Socios',
      render: (f: FondoRotatorio) => (
        <span className="flex items-center gap-1 text-sm">
          <Users className="h-3.5 w-3.5 text-gray-400" />
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
          <Link to={`/fondos/${f.id}`} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]">
            <Eye className="h-4 w-4" />
          </Link>
          <Link to={`/fondos/${f.id}/editar`} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => setDeleteId(f.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
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
          title="Fondos Rotatorios"
          description="Administración de fondos de la organización"
        />
        <div className="flex items-center gap-3">
          <Button as="link" to="/fondos/nuevo" iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo Fondo
          </Button>
          <Button variant="secondary" onClick={handleExportCsv} iconLeft={<Download className="h-4 w-4" />}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{data?.total || 0}</p>
              <p className="text-xs text-gray-500">Total Fondos</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              {data?.capitalResumen?.length ? (
                <div className="space-y-0.5">
                  {data.capitalResumen.map((r) => (
                    <p key={r.moneda} className="text-lg font-bold text-[#111827]">
                      {formatMonto(r.capitalDisponible, r.moneda)}
                      <span className="text-xs font-normal text-gray-500"> {r.moneda === 'PEN' ? 'soles' : 'dólares'}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#111827]">0</p>
              )}
              <p className="text-xs text-gray-500">Capital Disponible Total</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{data?.totalSocios || 0}</p>
              <p className="text-xs text-gray-500">Socios en Fondos (activos)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar por nombre de fondo u organización..."
          value={search}
          onChange={(val) => { setSearch(val); setPage(1) }}
          className="max-w-md"
        />
        <Select
          className="w-full sm:w-48"
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'ACTIVO', label: 'Activos' },
            { value: 'INACTIVO', label: 'Inactivos' },
            { value: 'CERRADO', label: 'Cerrados' },
          ]}
        />
      </div>

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
        onPageChange={setPage}
      />

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
