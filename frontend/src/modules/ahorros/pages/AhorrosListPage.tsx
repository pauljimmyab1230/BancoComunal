import { useState } from 'react'
import { Plus, PiggyBank, Wallet, Users, Eye } from 'lucide-react'
import { useCuentasAhorro } from '../hooks/useAhorros'
import { Button, DataTable, SearchInput, Badge, SectionHeader, Card } from '@/components/ui'
import { Link } from 'react-router-dom'
import type { CuentaAhorro } from '../types'

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

export default function AhorrosListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCuentasAhorro({ search, page, limit: 10 })
  const cuentas = data?.data || []

  const columns = [
    {
      key: 'socio',
      label: 'Socio',
      render: (c: CuentaAhorro) => (
        <Link to={`/socios/${c.socio.id}`} className="flex items-center gap-2 text-sm hover:text-[#2563EB]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
            {c.socio.nombres.charAt(0)}{c.socio.apellidoPaterno.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[#111827]">{c.socio.nombres} {c.socio.apellidoPaterno}</p>
            <p className="text-xs text-gray-400">{c.socio.codigo}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'fondo',
      label: 'Fondo',
      render: (c: CuentaAhorro) => (
        <Link to={`/fondos/${c.fondo.id}`} className="text-sm text-gray-600 hover:text-[#2563EB]">
          {c.fondo.nombre}
        </Link>
      ),
    },
    {
      key: 'saldo',
      label: 'Saldo',
      render: (c: CuentaAhorro) => (
        <span className={`font-medium ${c.saldo > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatMonto(c.saldo, c.fondo.moneda)}
        </span>
      ),
    },
    {
      key: 'movimientos',
      label: 'Mov.',
      render: (c: CuentaAhorro) => (
        <span className="text-sm text-gray-500">{c.totalMovimientos || 0}</span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (c: CuentaAhorro) => (
        c.estado === 'ACTIVA'
          ? <Badge variant="green">Activa</Badge>
          : <Badge variant="gray">Inactiva</Badge>
      ),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (c: CuentaAhorro) => (
        <Link to={`/ahorros/${c.id}`} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#2563EB]/10 hover:text-[#2563EB]">
          <Eye className="h-4 w-4" />
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Cuentas de Ahorro"
          description="Administración de cuentas de ahorro de socios"
        />
        <Button as="link" to="/ahorros/nueva" iconLeft={<Plus className="h-4 w-4" />}>
          Nueva Cuenta
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : (data?.total || 0)}</p>
              <p className="text-xs text-gray-500">Total Cuentas</p>
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
                {isLoading ? '—' : formatMonto(cuentas.reduce((sum, c) => sum + c.saldo, 0))}
              </p>
              <p className="text-xs text-gray-500">Total Ahorrado</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{isLoading ? '—' : cuentas.filter(c => c.saldo > 0).length}</p>
              <p className="text-xs text-gray-500">Cuentas con saldo</p>
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
        data={cuentas}
        loading={isLoading}
        keyField="id"
        emptyTitle="No hay cuentas de ahorro"
        emptyDescription="Crea la primera cuenta de ahorro para un socio."
        emptyActionLabel="Nueva Cuenta"
        emptyActionTo="/ahorros/nueva"
        currentPage={data?.page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
