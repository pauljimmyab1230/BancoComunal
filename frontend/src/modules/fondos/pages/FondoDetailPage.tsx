import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Pencil,
  Building2,
  Wallet,
  Users,
  Percent,
  Plus,
  Trash2,
  Search,
  HandCoins,
} from 'lucide-react'
import { useFondo } from '../hooks/useFondos'
import { useSocios } from '@/modules/socios/hooks/useSocios'
import { useAportes } from '@/modules/aportes/hooks/useAportes'
import { useCreditos } from '@/modules/creditos/hooks/useCreditos'
import { Button, Card, Badge, LoadingSpinner, Modal, Input, ConfirmDialog } from '@/components/ui'
import { fondosApi } from '../api/fondosApi'
import { getErrorMessage } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function FondoDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useFondo(Number(id))
  const fondo = data?.data
  const queryClient = useQueryClient()

  const [showSocioModal, setShowSocioModal] = useState(false)
  const [socioSearch, setSocioSearch] = useState('')
  const [savingSocio, setSavingSocio] = useState(false)
  const [removeSocioId, setRemoveSocioId] = useState<number | null>(null)

  const { data: sociosData } = useSocios({ search: socioSearch, limit: 20 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando datos del fondo..." />
      </div>
    )
  }

  if (!fondo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Fondo no encontrado</p>
        <Button as="link" to="/fondos" variant="ghost" iconLeft={<ArrowLeft className="h-4 w-4" />} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  const estadoBadge = (() => {
    switch (fondo.estado) {
      case 'ACTIVO': return <Badge variant="green">Activo</Badge>
      case 'INACTIVO': return <Badge variant="yellow">Inactivo</Badge>
      case 'CERRADO': return <Badge variant="gray">Cerrado</Badge>
      default: return <Badge>{fondo.estado}</Badge>
    }
  })()

  const capitalUsado = fondo.capitalPrestado ?? 0
  const porcentajeUsado = fondo.capitalInicial > 0 ? (capitalUsado / fondo.capitalInicial) * 100 : 0

  const handleAddSocio = async (socioId: number) => {
    setSavingSocio(true)
    try {
      await fondosApi.addSocio(fondo.id, socioId)
      queryClient.invalidateQueries({ queryKey: ['fondo', fondo.id] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Socio agregado al fondo')
      setShowSocioModal(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al agregar socio'))
    } finally {
      setSavingSocio(false)
    }
  }

  const handleRemoveSocio = async (socioId: number) => {
    try {
      await fondosApi.removeSocio(fondo.id, socioId)
      queryClient.invalidateQueries({ queryKey: ['fondo', fondo.id] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Socio retirado del fondo')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al retirar socio'))
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" as="link" to="/fondos" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Fondos
        </Button>
        <div className="flex-1" />
        <Button variant="secondary" as="link" to={`/fondos/${fondo.id}/editar`} iconLeft={<Pencil className="h-4 w-4" />}>
          Editar
        </Button>
      </div>

      {/* Header */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB]/10">
              <Building2 className="h-8 w-8 text-[#2563EB]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#111827]">{fondo.nombre}</h1>
                {estadoBadge}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {fondo.organizacion && `${fondo.organizacion} · `}
                {fondo.moneda === 'PEN' ? 'Soles' : 'Dólares'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Capital Inicial</p>
              <p className="text-xl font-bold text-[#111827]">
                {fondo.capitalInicial.toLocaleString('es-PE', { style: 'currency', currency: fondo.moneda })}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Disponible</p>
              <p className="text-xl font-bold text-emerald-600">
                {fondo.capitalDisponible.toLocaleString('es-PE', { style: 'currency', currency: fondo.moneda })}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Capital Prestado (saldo vigente)</p>
              <p className="text-xl font-bold text-amber-600">
                {capitalUsado.toLocaleString('es-PE', { style: 'currency', currency: fondo.moneda })}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Socios</p>
              <p className="text-xl font-bold text-[#111827]">{fondo.socios?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de uso de capital */}
      <Card padding="md" className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#111827]">Uso del Capital</span>
          <span className="text-sm text-gray-500">{porcentajeUsado.toFixed(1)}% utilizado</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] transition-all duration-500"
            style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>Disponible: {fondo.capitalDisponible.toLocaleString()}</span>
          <span>Prestado: {capitalUsado.toLocaleString()}</span>
        </div>
      </Card>

      {/* Socios del Fondo */}
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Socios del Fondo</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowSocioModal(true)} iconLeft={<Plus className="h-4 w-4" />}>
            Agregar Socio
          </Button>
        </div>

        {(!fondo.socios || fondo.socios.length === 0) ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay socios asignados a este fondo. Agrega socios para empezar.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">N°</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Código</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">DNI</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Nombres</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Ingreso</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fondo.socios.map((rel: any) => (
                  <tr key={rel.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-[#2563EB]">{rel.numeroSocio ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-[#111827]">{rel.socio.codigo}</td>
                    <td className="px-4 py-3 text-gray-600">{rel.socio.dni}</td>
                    <td className="px-4 py-3">
                      <Link to={`/socios/${rel.socio.id}`} className="font-medium text-[#111827] hover:text-[#2563EB]">
                        {rel.socio.nombres} {rel.socio.apellidoPaterno}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(rel.fechaIngreso).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {rel.socio.estado === 'A' ? <Badge variant="green">Activo</Badge> : <Badge variant="gray">Inactivo</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRemoveSocioId(rel.socio.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Aportes del Fondo */}
      <Card padding="lg" className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Aportes</h3>
          </div>
          <Button variant="secondary" size="sm" as="link" to={`/aportes?fondoId=${fondo.id}`}>
            Ver todos
          </Button>
        </div>
        <AportesFondoSection fondoId={fondo.id} moneda={fondo.moneda} />
      </Card>

      {/* Créditos del Fondo */}
      <Card padding="lg" className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-[#2563EB]" />
          <h3 className="font-semibold text-[#111827]">Créditos</h3>
        </div>
        <CreditosFondoSection fondoId={fondo.id} moneda={fondo.moneda} />
      </Card>

      {/* Modal Agregar Socio */}
      <Modal open={showSocioModal} onClose={() => setShowSocioModal(false)} title="Agregar Socio al Fondo" maxWidth="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={socioSearch}
              onChange={(e) => setSocioSearch(e.target.value)}
              placeholder="Buscar socio por DNI o nombres..."
              className="pl-10"
            />
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {sociosData?.data?.map((socio: any) => {
              const yaAsignado = fondo.socios?.some((r: any) => r.socio.id === socio.id)
              return (
                <div
                  key={socio.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    yaAsignado ? 'border-gray-100 bg-gray-50 opacity-50' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB]/10 text-sm font-semibold text-[#2563EB]">
                      {socio.nombres.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {socio.nombres} {socio.apellidoPaterno} {socio.apellidoMaterno}
                      </p>
                      <p className="text-xs text-gray-500">{socio.dni} · {socio.codigo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {socio.estado === 'I' && <Badge variant="red">Inactivo</Badge>}
                    <Button
                      size="sm"
                      disabled={yaAsignado || savingSocio}
                      loading={savingSocio}
                      onClick={() => handleAddSocio(socio.id)}
                    >
                      {yaAsignado ? 'Ya asignado' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              )
            })}
            {sociosData?.data?.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No se encontraron socios</p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={removeSocioId !== null}
        onClose={() => setRemoveSocioId(null)}
        onConfirm={() => {
          if (removeSocioId !== null) handleRemoveSocio(removeSocioId)
          setRemoveSocioId(null)
        }}
        title="Retirar Socio"
        message="¿Estás seguro de retirar a este socio del fondo?"
        confirmText="Retirar"
        variant="danger"
      />
    </div>
  )
}

function AportesFondoSection({ fondoId, moneda }: { fondoId: number; moneda: string }) {
  const { data, isLoading } = useAportes({ fondoId, limit: 5 })

  const aportes = data?.data || []

  if (isLoading) {
    return <p className="text-sm text-gray-400">Cargando aportes...</p>
  }

  if (aportes.length === 0) {
    return <p className="text-sm text-gray-400">No hay aportes registrados en este fondo</p>
  }

  const formatMonto = (monto: number) =>
    monto.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Socio</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Monto</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Período</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {aportes.map((a: any) => (
            <tr key={a.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <Link to={`/socios/${a.socio.id}`} className="font-medium text-[#111827] hover:text-[#2563EB]">
                  {a.socio.nombres} {a.socio.apellidoPaterno}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{a.tipo}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">{formatMonto(a.monto)}</td>
              <td className="px-4 py-3 text-gray-600">{a.periodo}</td>
              <td className="px-4 py-3 text-gray-600">
                {format(new Date(a.fechaAporte), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/aportes/${a.id}`}
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                >
                  Detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CreditosFondoSection({ fondoId, moneda }: { fondoId: number; moneda: string }) {
  const { data, isLoading } = useCreditos({ fondoId, limit: 10 })
  const prestamos = data?.data || []

  if (isLoading) return <p className="text-sm text-gray-400">Cargando créditos...</p>
  if (prestamos.length === 0) return <p className="text-sm text-gray-400">No hay créditos en este fondo</p>

  const formatMonto = (m: number) =>
    m.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Socio</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Monto</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Cuotas</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Pagadas</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {prestamos.map((p: any) => (
            <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <Link to={`/socios/${p.socio.id}`} className="font-medium text-[#111827] hover:text-[#2563EB]">
                  {p.socio.nombres} {p.socio.apellidoPaterno}
                </Link>
              </td>
              <td className="px-4 py-3 font-medium text-[#111827]">{formatMonto(p.monto)}</td>
              <td className="px-4 py-3 text-gray-600">{p.numeroCuotas} × {formatMonto(p.montoCuota)}</td>
              <td className="px-4 py-3 text-emerald-600">{p.totalCuotas || 0}/{p.numeroCuotas}</td>
              <td className="px-4 py-3">
                {p.estado === 'ACTIVO' && <Badge variant="blue">Activo</Badge>}
                {p.estado === 'PAGADO' && <Badge variant="green">Pagado</Badge>}
                {p.estado === 'ANULADO' && <Badge variant="gray">Anulado</Badge>}
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/creditos/${p.id}`} className="text-xs font-medium text-[#2563EB] hover:underline">Ver</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
