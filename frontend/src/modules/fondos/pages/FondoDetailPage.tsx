import { useMemo, useState } from 'react'
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
  Printer,
  Lock,
} from 'lucide-react'
import { useFondo } from '../hooks/useFondos'
import { useSocios } from '@/modules/socios/hooks/useSocios'
import { useAportes } from '@/modules/aportes/hooks/useAportes'
import { useCreditos } from '@/modules/creditos/hooks/useCreditos'
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  Modal,
  Input,
  ConfirmDialog,
  Select,
  EmptyState,
} from '@/components/ui'
import { fondosApi } from '../api/fondosApi'
import type { FondoSocio } from '../types'
import type { Socio } from '@/types'
import type { Aporte } from '@/modules/aportes/types'
import type { Prestamo } from '@/modules/creditos/types'
import { getErrorMessage, openProtectedPdf, api } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type TabId = 'resumen' | 'socios' | 'aportes' | 'creditos'

export default function FondoDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useFondo(Number(id))
  const fondo = data?.data
  const queryClient = useQueryClient()

  const [tabActiva, setTabActiva] = useState<TabId>('resumen')
  const [showSocioModal, setShowSocioModal] = useState(false)
  const [socioSearch, setSocioSearch] = useState('')
  const [socioFilter, setSocioFilter] = useState('')
  const [savingSocio, setSavingSocio] = useState(false)
  const [removeSocioId, setRemoveSocioId] = useState<number | null>(null)
  const [cerrarFondo, setCerrarFondo] = useState(false)
  const [printingPadron, setPrintingPadron] = useState(false)
  const [printingResumen, setPrintingResumen] = useState(false)
  const [printingAportes, setPrintingAportes] = useState(false)
  const [anioAportes, setAnioAportes] = useState(new Date().getFullYear())
  const [periodoAportes, setPeriodoAportes] = useState('')

  const { data: aniosAportesData } = useQuery({
    queryKey: ['aportes-fondo-anios', fondo?.id],
    queryFn: () =>
      api
        .get('/reportes/aportes-fondo/anios', { params: { fondoId: fondo?.id } })
        .then((r) => r.data?.data as number[]),
    enabled: !!fondo,
  })

  const [prevAnios, setPrevAnios] = useState(aniosAportesData)

  if (aniosAportesData && aniosAportesData !== prevAnios) {
    setPrevAnios(aniosAportesData)
    if (aniosAportesData.length > 0 && !aniosAportesData.includes(anioAportes)) {
      const primerAnio = aniosAportesData[0]
      if (primerAnio !== undefined) setAnioAportes(primerAnio)
    }
  }

  const { data: sociosData } = useSocios({ search: socioSearch, limit: 20 })

  const cerrarMutation = useMutation({
    mutationFn: () => fondosApi.update(fondo!.id, { estado: 'CERRADO' }),
    onSuccess: () => {
      toast.success('Fondo cerrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['fondo', fondo!.id] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setCerrarFondo(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cerrar el fondo')
    },
  })

  const aniosOptions = useMemo(() => {
    const anios =
      aniosAportesData && aniosAportesData.length > 0
        ? aniosAportesData
        : [new Date().getFullYear()]
    return anios.map((a) => ({ value: String(a), label: String(a) }))
  }, [aniosAportesData])

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
        <p className="text-muted">Fondo no encontrado</p>
        <Button
          as="link"
          to="/fondos"
          variant="ghost"
          iconLeft={<ArrowLeft className="h-4 w-4" />}
          className="mt-4"
        >
          Volver
        </Button>
      </div>
    )
  }

  const capitalUsado = fondo.capitalPrestado ?? 0
  const porcentajeUsado = fondo.capitalInicial > 0 ? (capitalUsado / fondo.capitalInicial) * 100 : 0
  const esActivo = fondo.estado === 'ACTIVO'

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

  const handleImprimirPadron = async () => {
    try {
      setPrintingPadron(true)
      await openProtectedPdf(`/reportes/padron-fondo/pdf?fondoId=${fondo.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el padrón de socios'))
    } finally {
      setPrintingPadron(false)
    }
  }

  const handleImprimirResumen = async () => {
    try {
      setPrintingResumen(true)
      await openProtectedPdf(`/reportes/resumen-fondo/pdf?fondoId=${fondo.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el resumen del fondo'))
    } finally {
      setPrintingResumen(false)
    }
  }

  const handleImprimirAportes = async () => {
    try {
      setPrintingAportes(true)
      const params = periodoAportes
        ? `fondoId=${fondo.id}&periodo=${periodoAportes}`
        : `fondoId=${fondo.id}&anio=${anioAportes}`
      await openProtectedPdf(`/reportes/aportes-fondo/pdf?${params}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el historial de aportes del fondo'))
    } finally {
      setPrintingAportes(false)
    }
  }

  const sociosFiltrados = (() => {
    const lista = fondo.socios || []
    const q = socioFilter.trim().toLowerCase()
    if (!q) return lista
    return lista.filter((rel) => {
      const { nombres, apellidoPaterno, apellidoMaterno, dni, codigo } = rel.socio
      return [nombres, apellidoPaterno, apellidoMaterno, dni, codigo]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  })()

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'socios', label: 'Socios', count: fondo.socios?.length || 0 },
    { id: 'aportes', label: 'Aportes' },
    { id: 'creditos', label: 'Créditos' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" as="link" to="/fondos" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Fondos
        </Button>
        <div className="flex-1" />
        {esActivo && (
          <Button
            variant="secondary"
            onClick={() => setCerrarFondo(true)}
            iconLeft={<Lock className="h-4 w-4" />}
          >
            Cerrar Fondo
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={handleImprimirResumen}
          disabled={printingResumen}
          iconLeft={<Printer className="h-4 w-4" />}
        >
          {printingResumen ? 'Generando...' : 'Resumen PDF'}
        </Button>
        <Button
          as="link"
          to={`/fondos/${fondo.id}/editar`}
          iconLeft={<Pencil className="h-4 w-4" />}
        >
          Editar
        </Button>
      </div>

      {/* Header */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-secondary via-secondary-strong to-accent px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{fondo.nombre}</h1>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {fondo.estado === 'ACTIVO'
                    ? 'Activo'
                    : fondo.estado === 'INACTIVO'
                      ? 'Inactivo'
                      : 'Cerrado'}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80">
                {fondo.organizacion ? `${fondo.organizacion} · ` : ''}
                {fondo.moneda === 'PEN' ? 'Soles' : 'Dólares'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pestañas */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActiva(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tabActiva === tab.id
                ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                : 'text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  tabActiva === tab.id ? 'bg-white/20 text-white' : 'bg-surface-hover text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {tabActiva === 'resumen' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md" hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">Capital Inicial</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fondo.capitalInicial.toLocaleString('es-PE', {
                      style: 'currency',
                      currency: fondo.moneda,
                    })}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md" hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">Disponible</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {fondo.capitalDisponible.toLocaleString('es-PE', {
                      style: 'currency',
                      currency: fondo.moneda,
                    })}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md" hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">Capital Prestado (saldo vigente)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {capitalUsado.toLocaleString('es-PE', {
                      style: 'currency',
                      currency: fondo.moneda,
                    })}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md" hover={false}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted">Socios</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fondo.totalSocios ?? fondo.socios?.length ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="md" hover={false}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Uso del Capital</span>
              <span className="text-sm text-muted">{porcentajeUsado.toFixed(1)}% utilizado</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-subtle">
              <span>Disponible: {fondo.capitalDisponible.toLocaleString()}</span>
              <span>Prestado: {capitalUsado.toLocaleString()}</span>
            </div>
          </Card>
        </>
      )}

      {/* Socios */}
      {tabActiva === 'socios' && (
        <Card padding="lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Socios del Fondo</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImprimirPadron}
                disabled={printingPadron}
                iconLeft={<Printer className="h-4 w-4" />}
              >
                {printingPadron ? 'Generando...' : 'Padrón PDF'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSocioModal(true)}
                disabled={!esActivo}
                iconLeft={<Plus className="h-4 w-4" />}
              >
                Agregar Socio
              </Button>
            </div>
          </div>

          {!fondo.socios || fondo.socios.length === 0 ? (
            <EmptyState
              title="No hay socios asignados"
              description="Agrega socios a este fondo para empezar a registrar aportes y créditos."
              actionLabel="Agregar Socio"
              onAction={() => setShowSocioModal(true)}
            />
          ) : (
            <>
              <div className="relative mb-4 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  value={socioFilter}
                  onChange={(e) => setSocioFilter(e.target.value)}
                  placeholder="Buscar socio por nombre, DNI o código..."
                  className="pl-10"
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-muted/60">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        N°
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        Socio
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        DNI
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        Cargo
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        Ingreso
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        Estado
                      </th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {sociosFiltrados.map((rel: FondoSocio) => (
                      <tr key={rel.id} className="transition-colors hover:bg-surface-muted/60">
                        <td className="px-5 py-4 font-semibold text-secondary">
                          {rel.numeroSocio ?? '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(rel.socio.codigo)}`}
                            >
                              {getSocioIniciales(rel.socio.nombres, rel.socio.apellidoPaterno)}
                            </div>
                            <div>
                              <Link
                                to={`/socios/${rel.socio.id}`}
                                className="font-medium text-foreground hover:text-secondary"
                              >
                                {rel.socio.nombres} {rel.socio.apellidoPaterno}
                              </Link>
                              <p className="text-xs text-muted">{rel.socio.codigo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted">{rel.socio.dni}</td>
                        <td className="px-5 py-4">
                          {rel.cargo ? (
                            <span className="text-sm text-foreground">{rel.cargo}</span>
                          ) : (
                            <span className="text-sm text-subtle">—</span>
                          )}
                          {rel.nivel && (
                            <Badge variant="blue" className="ml-2">
                              {rel.nivel}
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted">
                          {rel.fechaIngreso ? new Date(rel.fechaIngreso).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {rel.socio.estado === 'A' ? (
                            <Badge variant="green">Activo</Badge>
                          ) : (
                            <Badge variant="gray">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setRemoveSocioId(rel.socio.id)}
                            aria-label={`Retirar socio ${rel.socio.nombres}`}
                            title="Retirar del fondo"
                            disabled={!esActivo}
                            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:pointer-events-none dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sociosFiltrados.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">
                    No se encontraron socios para esa búsqueda.
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Aportes */}
      {tabActiva === 'aportes' && (
        <Card padding="lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Aportes</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <Input
                  type="month"
                  value={periodoAportes}
                  onChange={(e) => setPeriodoAportes(e.target.value)}
                  placeholder="Período"
                  aria-label="Período del reporte"
                />
              </div>
              {!periodoAportes && (
                <div className="w-28">
                  <Select
                    options={aniosOptions}
                    value={String(anioAportes)}
                    onChange={(e) => setAnioAportes(Number(e.target.value))}
                    aria-label="Año del reporte"
                  />
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImprimirAportes}
                disabled={printingAportes}
                iconLeft={<Printer className="h-4 w-4" />}
              >
                {printingAportes ? 'Generando...' : 'Aportes PDF'}
              </Button>
              <Button variant="secondary" size="sm" as="link" to={`/aportes?fondoId=${fondo.id}`}>
                Ver todos
              </Button>
            </div>
          </div>
          <AportesFondoSection fondoId={fondo.id} moneda={fondo.moneda} />
        </Card>
      )}

      {/* Créditos */}
      {tabActiva === 'creditos' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold text-foreground">Créditos</h3>
          </div>
          <CreditosFondoSection fondoId={fondo.id} moneda={fondo.moneda} />
        </Card>
      )}

      {/* Modal Agregar Socio */}
      <Modal
        open={showSocioModal}
        onClose={() => setShowSocioModal(false)}
        title="Agregar Socio al Fondo"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              value={socioSearch}
              onChange={(e) => setSocioSearch(e.target.value)}
              placeholder="Buscar socio por DNI o nombres..."
              className="pl-10"
            />
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {sociosData?.data?.map((socio: Socio) => {
              const yaAsignado = fondo.socios?.some((r: FondoSocio) => r.socio.id === socio.id)
              return (
                <div
                  key={socio.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    yaAsignado
                      ? 'border-border-subtle bg-surface-muted opacity-50'
                      : 'border-border-subtle hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${getClaseAvatar(socio.codigo)}`}
                    >
                      {getSocioIniciales(socio.nombres, socio.apellidoPaterno)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {socio.nombres} {socio.apellidoPaterno} {socio.apellidoMaterno}
                      </p>
                      <p className="text-xs text-muted">
                        {socio.dni} · {socio.codigo}
                      </p>
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
              <p className="py-4 text-center text-sm text-subtle">No se encontraron socios</p>
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

      <ConfirmDialog
        open={cerrarFondo}
        onClose={() => setCerrarFondo(false)}
        onConfirm={() => cerrarMutation.mutate()}
        title="Cerrar Fondo"
        message="Al cerrar el fondo no se podrán registrar nuevas operaciones. Esta acción registra la fecha de cierre."
        confirmText="Cerrar Fondo"
        variant="danger"
        loading={cerrarMutation.isPending}
      />
    </div>
  )
}

function AportesFondoSection({ fondoId, moneda }: { fondoId: number; moneda: string }) {
  const { data, isLoading } = useAportes({ fondoId, limit: 5 })

  const aportes = data?.data || []

  if (isLoading) {
    return <p className="text-sm text-subtle">Cargando aportes...</p>
  }

  if (aportes.length === 0) {
    return <p className="text-sm text-subtle">No hay aportes registrados en este fondo</p>
  }

  const formatMonto = (monto: number) =>
    monto.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted/60">
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Socio
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Tipo
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Monto
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Período
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Fecha
            </th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {aportes.map((a: Aporte) => (
            <tr key={a.id} className="transition-colors hover:bg-surface-muted/60">
              <td className="px-5 py-4">
                <Link
                  to={`/socios/${a.socio.id}`}
                  className="font-medium text-foreground hover:text-secondary"
                >
                  {a.socio.nombres} {a.socio.apellidoPaterno}
                </Link>
              </td>
              <td className="px-5 py-4 text-muted">{a.tipo}</td>
              <td className="px-5 py-4 font-medium text-foreground">{formatMonto(a.monto)}</td>
              <td className="px-5 py-4 text-muted">{a.periodo}</td>
              <td className="px-5 py-4 text-muted">
                {format(new Date(a.fechaAporte), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  to={`/aportes/${a.id}`}
                  className="text-xs font-medium text-secondary hover:underline"
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

  if (isLoading) return <p className="text-sm text-subtle">Cargando créditos...</p>
  if (prestamos.length === 0)
    return <p className="text-sm text-subtle">No hay créditos en este fondo</p>

  const formatMonto = (m: number) =>
    m.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted/60">
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Socio
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Monto
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Cuotas
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Pagadas
            </th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Estado
            </th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {prestamos.map((p: Prestamo) => (
            <tr key={p.id} className="transition-colors hover:bg-surface-muted/60">
              <td className="px-5 py-4">
                <Link
                  to={`/socios/${p.socio.id}`}
                  className="font-medium text-foreground hover:text-secondary"
                >
                  {p.socio.nombres} {p.socio.apellidoPaterno}
                </Link>
              </td>
              <td className="px-5 py-4 font-medium text-foreground">{formatMonto(p.monto)}</td>
              <td className="px-5 py-4 text-muted">
                {p.numeroCuotas} × {formatMonto(p.montoCuota)}
              </td>
              <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400">
                {p.totalCuotas || 0}/{p.numeroCuotas}
              </td>
              <td className="px-5 py-4">
                {p.estado === 'ACTIVO' && <Badge variant="blue">Activo</Badge>}
                {p.estado === 'PAGADO' && <Badge variant="green">Pagado</Badge>}
                {p.estado === 'ANULADO' && <Badge variant="gray">Anulado</Badge>}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  to={`/creditos/${p.id}`}
                  className="text-xs font-medium text-secondary hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
