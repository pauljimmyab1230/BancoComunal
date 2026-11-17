import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  FileText,
  Users,
  QrCode,
  Download,
  Plus,
  Trash2,
  Printer,
  HandCoins,
  Landmark,
  Upload,
} from 'lucide-react'
import { useSocio } from '../hooks/useSocios'
import type { Beneficiario } from '../types'
import { useAportes } from '@/modules/aportes/hooks/useAportes'
import { useCreditos } from '@/modules/creditos/hooks/useCreditos'
import type { Aporte } from '@/modules/aportes/types'
import type { Prestamo } from '@/modules/creditos/types'
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  Modal,
  Input,
  Select,
  FormField,
  QRCode,
  ConfirmDialog,
  ErrorState,
} from '@/components/ui'
import { socioApi } from '../api/socioApi'
import { getErrorMessage, openProtectedPdf } from '@/lib/api'
import { getSocioIniciales, getClaseAvatar } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { es } from 'date-fns/locale'

const etiquetasParentesco: Record<string, string> = {
  CONYUGE: 'Cónyuge',
  HIJO: 'Hijo(a)',
  PADRE: 'Padre',
  MADRE: 'Madre',
  HERMANO: 'Hermano(a)',
  ABUELO: 'Abuelo(a)',
  OTRO: 'Otro',
}

const beneficiarioSchema = z.object({
  dni: z.string().length(8, '8 dígitos').regex(/^\d+$/),
  nombres: z.string().min(2).max(100),
  apellidoPaterno: z.string().min(2).max(50),
  apellidoMaterno: z.string().min(2).max(50),
  parentesco: z.string().min(2).max(50),
  telefono: z.string().max(9).optional().or(z.literal('')),
  fechaNacimiento: z.string().optional().or(z.literal('')),
})

type BeneficiarioForm = z.infer<typeof beneficiarioSchema>

type TabId = 'resumen' | 'beneficiarios' | 'fondos' | 'aportes' | 'creditos' | 'documentos'

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export default function SocioDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError, error, refetch } = useSocio(Number(id))
  const socio = data?.data
  const queryClient = useQueryClient()
  const [tabActiva, setTabActiva] = useState<TabId>('resumen')

  // Beneficiario modal
  const [showBenModal, setShowBenModal] = useState(false)
  const [editingBen, setEditingBen] = useState<Beneficiario | null>(null)
  const [savingBen, setSavingBen] = useState(false)

  // Documento modal
  const [showDocModal, setShowDocModal] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docTipo, setDocTipo] = useState('OTRO')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)

  // QR modal
  const [showQr, setShowQr] = useState(false)
  const [printingFicha, setPrintingFicha] = useState(false)
  const [printingAportes, setPrintingAportes] = useState(false)
  const [printingCreditos, setPrintingCreditos] = useState(false)
  const [printingCuenta, setPrintingCuenta] = useState(false)
  const [fondoSelectorFor, setFondoSelectorFor] = useState<
    'ficha' | 'aportes' | 'creditos' | 'cuenta' | null
  >(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BeneficiarioForm>({
    resolver: zodResolver(beneficiarioSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      parentesco: '',
      telefono: '',
      fechaNacimiento: '',
    },
  })

  const openAddBen = () => {
    setEditingBen(null)
    reset({
      dni: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      parentesco: '',
      telefono: '',
      fechaNacimiento: '',
    })
    setShowBenModal(true)
  }

  const openEditBen = (ben: Beneficiario) => {
    setEditingBen(ben)
    reset({
      dni: ben.dni,
      nombres: ben.nombres,
      apellidoPaterno: ben.apellidoPaterno,
      apellidoMaterno: ben.apellidoMaterno,
      parentesco: ben.parentesco,
      telefono: ben.telefono || '',
      fechaNacimiento: ben.fechaNacimiento?.split('T')[0] || '',
    })
    setShowBenModal(true)
  }

  const handleSaveBeneficiario = async (values: BeneficiarioForm) => {
    if (!socio) return
    setSavingBen(true)
    try {
      if (editingBen) {
        await socioApi.updateBeneficiario(socio.id, editingBen.id, values)
        toast.success('Beneficiario actualizado')
      } else {
        await socioApi.addBeneficiario(socio.id, values)
        toast.success('Beneficiario agregado')
      }
      queryClient.invalidateQueries({ queryKey: ['socio', socio.id] })
      setShowBenModal(false)
      setEditingBen(null)
      reset()
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingBen ? 'Error al actualizar beneficiario' : 'Error al agregar beneficiario'
        )
      )
    } finally {
      setSavingBen(false)
    }
  }

  const [benAEliminar, setBenAEliminar] = useState<number | null>(null)
  const [docAEliminar, setDocAEliminar] = useState<number | null>(null)

  const handleDeleteBeneficiario = async (beneficiarioId: number) => {
    if (!socio) return
    try {
      await socioApi.deleteBeneficiario(socio.id, beneficiarioId)
      queryClient.invalidateQueries({ queryKey: ['socio', socio.id] })
      toast.success('Beneficiario eliminado')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al eliminar beneficiario'))
    } finally {
      setBenAEliminar(null)
    }
  }

  const handleUploadDocumento = async () => {
    if (!socio || !docFile) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('documento', docFile)
      formData.append('tipoDocumento', docTipo)
      await socioApi.uploadDocumento(socio.id, formData)
      queryClient.invalidateQueries({ queryKey: ['socio', socio.id] })
      toast.success('Documento subido correctamente')
      setShowDocModal(false)
      setDocFile(null)
      setDocTipo('OTRO')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al subir documento'))
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDocumento = async (docId: number) => {
    if (!socio) return
    try {
      await socioApi.deleteDocumento(socio.id, docId)
      queryClient.invalidateQueries({ queryKey: ['socio', socio.id] })
      toast.success('Documento eliminado')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al eliminar documento'))
    } finally {
      setDocAEliminar(null)
    }
  }

  const generarFicha = async (fondoId?: number) => {
    if (!socio) return
    try {
      setPrintingFicha(true)
      const params = fondoId ? `&fondoId=${fondoId}` : ''
      await openProtectedPdf(`/reportes/ficha-socio/pdf?socioId=${socio.id}${params}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar la ficha imprimible'))
    } finally {
      setPrintingFicha(false)
    }
  }

  const generarAportes = async (fondoId?: number) => {
    if (!socio) return
    try {
      setPrintingAportes(true)
      const params = fondoId ? `&fondoId=${fondoId}` : ''
      await openProtectedPdf(`/reportes/aportes-socio/pdf?socioId=${socio.id}${params}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el historial de aportes'))
    } finally {
      setPrintingAportes(false)
    }
  }

  const generarCreditos = async (fondoId?: number) => {
    if (!socio) return
    try {
      setPrintingCreditos(true)
      const params = fondoId ? `&fondoId=${fondoId}` : ''
      await openProtectedPdf(`/reportes/creditos-socio/pdf?socioId=${socio.id}${params}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el historial de créditos'))
    } finally {
      setPrintingCreditos(false)
    }
  }

  const generarCuenta = async (fondoId?: number) => {
    if (!socio) return
    try {
      setPrintingCuenta(true)
      const params = fondoId ? `&fondoId=${fondoId}` : ''
      await openProtectedPdf(`/reportes/estado-cuenta-socio/pdf?socioId=${socio.id}${params}`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al generar el estado de cuenta'))
    } finally {
      setPrintingCuenta(false)
    }
  }

  const fondosActivos = (socio?.fondosSocios || [])
    .filter((rel) => rel.fondo && rel.fondo.estado === 'ACTIVO')
    .map((rel) => ({ id: rel.fondo!.id, nombre: rel.fondo!.nombre }))

  const handleImprimirFicha = async () => {
    if (!socio) return
    if (fondosActivos.length > 1) {
      setFondoSelectorFor('ficha')
      return
    }
    await generarFicha(fondosActivos[0]?.id)
  }

  const handleImprimirAportes = async () => {
    if (!socio) return
    if (fondosActivos.length > 1) {
      setFondoSelectorFor('aportes')
      return
    }
    await generarAportes(fondosActivos[0]?.id)
  }

  const handleImprimirCreditos = async () => {
    if (!socio) return
    if (fondosActivos.length > 1) {
      setFondoSelectorFor('creditos')
      return
    }
    await generarCreditos(fondosActivos[0]?.id)
  }

  const handleImprimirCuenta = async () => {
    if (!socio) return
    if (fondosActivos.length > 1) {
      setFondoSelectorFor('cuenta')
      return
    }
    await generarCuenta(fondosActivos[0]?.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando datos del socio..." />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="No se pudo cargar el socio"
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => refetch()}
      />
    )
  }

  if (!socio) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted">Socio no encontrado</p>
        <Button
          as="link"
          to="/socios"
          variant="ghost"
          iconLeft={<ArrowLeft className="h-4 w-4" />}
          className="mt-4"
        >
          Volver a Socios
        </Button>
      </div>
    )
  }

  const anios = socio.fechaIngreso
    ? Math.max(0, new Date().getFullYear() - new Date(socio.fechaIngreso).getFullYear())
    : 0

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'beneficiarios', label: 'Beneficiarios', count: socio.beneficiarios?.length || 0 },
    { id: 'fondos', label: 'Fondos', count: socio.fondosSocios?.length || 0 },
    { id: 'aportes', label: 'Aportes' },
    { id: 'creditos', label: 'Créditos' },
    { id: 'documentos', label: 'Documentos', count: socio.documentos?.length || 0 },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" as="link" to="/socios" iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Socios
        </Button>
        <div className="flex-1" />
        <Button
          variant="secondary"
          onClick={handleImprimirFicha}
          disabled={printingFicha}
          iconLeft={<Printer className="h-4 w-4" />}
        >
          {printingFicha ? 'Generando...' : 'Ficha'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleImprimirCuenta}
          disabled={printingCuenta}
          iconLeft={<Printer className="h-4 w-4" />}
        >
          {printingCuenta ? 'Generando...' : 'Estado de Cuenta'}
        </Button>
        <Button
          as="link"
          to={`/socios/${socio.id}/editar`}
          iconLeft={<Pencil className="h-4 w-4" />}
        >
          Editar
        </Button>
      </div>

      {/* Cabecera tipo portada */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-secondary via-secondary-strong to-accent px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 ring-2 ring-white/40">
              {socio.fotoUrl ? (
                <img
                  src={socio.fotoUrl}
                  alt={socio.nombreCompleto}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {getSocioIniciales(socio.nombres, socio.apellidoPaterno)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{socio.nombreCompleto}</h1>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {socio.estado === 'A' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80">
                Código: <span className="font-semibold text-white">{socio.codigo}</span>
                {' · '}DNI: <span className="font-semibold text-white">{socio.dni}</span>
              </p>
            </div>
            <button
              onClick={() => setShowQr(true)}
              aria-label="Ver código QR del socio"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/25"
            >
              <QrCode className="h-5 w-5" />
              <span className="hidden sm:inline">QR</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4 sm:px-8">
          <StatItem label="Fondos" value={socio.fondosSocios?.length || 0} />
          <StatItem label="Beneficiarios" value={socio.beneficiarios?.length || 0} />
          <StatItem label="Documentos" value={socio.documentos?.length || 0} />
          <StatItem
            label="Antigüedad"
            value={anios > 0 ? `${anios} año${anios === 1 ? '' : 's'}` : '—'}
          />
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

      {/* Contenido de pestañas */}
      {tabActiva === 'resumen' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Datos Personales</h3>
            </div>
            <div className="space-y-4">
              <InfoRow
                icon={User}
                label="Género"
                value={socio.genero === 'M' ? 'Masculino' : 'Femenino'}
              />
              <InfoRow
                icon={Calendar}
                label="Fecha de Nacimiento"
                value={
                  socio.fechaNacimiento ? new Date(socio.fechaNacimiento).toLocaleDateString() : '—'
                }
              />
              <InfoRow
                icon={Shield}
                label="Estado Civil"
                value={
                  { S: 'Soltero', C: 'Casado', V: 'Viudo', D: 'Divorciado' }[
                    socio.estadoCivil || ''
                  ] || '—'
                }
              />
              <InfoRow
                icon={Calendar}
                label="Ingreso"
                value={new Date(socio.fechaIngreso).toLocaleDateString()}
              />
            </div>
          </Card>

          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Contacto</h3>
            </div>
            <div className="space-y-4">
              <InfoRow icon={Phone} label="Teléfono" value={socio.telefono || '—'} />
              <InfoRow icon={Mail} label="Correo" value={socio.email || '—'} />
              <InfoRow icon={MapPin} label="Dirección" value={socio.direccion || '—'} />
            </div>
          </Card>
        </div>
      )}

      {tabActiva === 'documentos' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Documentos</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDocModal(true)}
              iconLeft={<Upload className="h-4 w-4" />}
            >
              Subir
            </Button>
          </div>
          {!socio.documentos || socio.documentos.length === 0 ? (
            <p className="text-sm text-muted">Sin documentos adjuntos</p>
          ) : (
            <div className="space-y-3">
              {socio.documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle p-3"
                >
                  <FileText className="h-8 w-8 shrink-0 text-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {doc.nombreArchivo}
                    </p>
                    <p className="text-xs text-muted">
                      {doc.tipoDocumento} · {formatBytes(doc.tamano)}
                    </p>
                  </div>
                  <a
                    href={doc.rutaArchivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-muted hover:text-secondary"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => setDocAEliminar(doc.id)}
                    aria-label={`Eliminar documento ${doc.nombreArchivo}`}
                    title="Eliminar documento"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tabActiva === 'beneficiarios' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Beneficiarios</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={openAddBen}
              iconLeft={<Plus className="h-4 w-4" />}
            >
              Agregar
            </Button>
          </div>
          {!socio.beneficiarios || socio.beneficiarios.length === 0 ? (
            <p className="text-sm text-muted">No tiene beneficiarios registrados</p>
          ) : (
            <div className="space-y-3">
              {socio.beneficiarios.map((ben) => (
                <div
                  key={ben.id}
                  className="flex items-center gap-4 rounded-lg border border-border-subtle p-4"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getClaseAvatar(ben.nombres)}`}
                  >
                    {ben.nombres.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {ben.nombres} {ben.apellidoPaterno} {ben.apellidoMaterno}
                    </p>
                    <p className="text-xs text-muted">
                      DNI: {ben.dni} · {etiquetasParentesco[ben.parentesco] || ben.parentesco}
                      {ben.telefono && ` · ${ben.telefono}`}
                      {ben.fechaNacimiento &&
                        ` · Nac: ${new Date(ben.fechaNacimiento).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditBen(ben)}
                    aria-label={`Editar beneficiario ${ben.nombres}`}
                    title="Editar beneficiario"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setBenAEliminar(ben.id)}
                    aria-label={`Eliminar beneficiario ${ben.nombres}`}
                    title="Eliminar beneficiario"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tabActiva === 'fondos' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Fondos</h3>
            </div>
            <Button variant="secondary" size="sm" as="link" to="/fondos">
              Ver todos
            </Button>
          </div>
          {!socio.fondosSocios || socio.fondosSocios.length === 0 ? (
            <p className="text-sm text-muted">No pertenece a ningún fondo</p>
          ) : (
            <div className="space-y-3">
              {socio.fondosSocios.map((fs) => (
                <div
                  key={fs.id}
                  className="flex items-center gap-4 rounded-lg border border-border-subtle p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/fondos/${fs.fondo?.id ?? fs.fondoId}`}
                      className="text-sm font-medium text-foreground hover:text-secondary"
                    >
                      {fs.fondo?.nombre ?? `Fondo #${fs.fondoId}`}
                    </Link>
                    <p className="text-xs text-muted">
                      {fs.numeroSocio ? `N° ${fs.numeroSocio}` : ''}
                      {fs.cargo ? ` · ${fs.cargo}` : ''}
                      {fs.nivel ? ` · ${fs.nivel}` : ''}
                      {fs.fechaIngreso
                        ? ` · Ingreso: ${new Date(fs.fechaIngreso).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tabActiva === 'aportes' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Aportes</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImprimirAportes}
                disabled={printingAportes}
                iconLeft={<Printer className="h-4 w-4" />}
              >
                {printingAportes ? 'Generando...' : 'Historial PDF'}
              </Button>
              <Button variant="secondary" size="sm" as="link" to={`/aportes?socioId=${socio.id}`}>
                Ver todos
              </Button>
            </div>
          </div>
          <AportesSocioSection socioId={socio.id} />
        </Card>
      )}

      {tabActiva === 'creditos' && (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Créditos</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImprimirCreditos}
                disabled={printingCreditos}
                iconLeft={<Printer className="h-4 w-4" />}
              >
                {printingCreditos ? 'Generando...' : 'Historial PDF'}
              </Button>
              <Button variant="secondary" size="sm" as="link" to={`/creditos?socioId=${socio.id}`}>
                Ver todos
              </Button>
            </div>
          </div>
          <CreditosSocioSection socioId={socio.id} />
        </Card>
      )}

      {/* Modal Beneficiario (Add/Edit) */}
      <Modal
        open={showBenModal}
        onClose={() => {
          setShowBenModal(false)
          setEditingBen(null)
          reset()
        }}
        title={editingBen ? 'Editar Beneficiario' : 'Agregar Beneficiario'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(handleSaveBeneficiario)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="DNI" required error={errors.dni?.message}>
              <Input
                {...register('dni')}
                placeholder="12345678"
                maxLength={8}
                error={errors.dni?.message}
              />
            </FormField>
            <FormField label="Parentesco" required error={errors.parentesco?.message}>
              <Select
                {...register('parentesco')}
                error={errors.parentesco?.message}
                options={[
                  { value: 'CONYUGE', label: 'Cónyuge' },
                  { value: 'HIJO', label: 'Hijo(a)' },
                  { value: 'PADRE', label: 'Padre' },
                  { value: 'MADRE', label: 'Madre' },
                  { value: 'HERMANO', label: 'Hermano(a)' },
                  { value: 'ABUELO', label: 'Abuelo(a)' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
              />
            </FormField>
            <FormField label="Nombres" required error={errors.nombres?.message}>
              <Input
                {...register('nombres')}
                placeholder="Nombres"
                error={errors.nombres?.message}
              />
            </FormField>
            <FormField label="Teléfono" error={errors.telefono?.message}>
              <Input
                {...register('telefono')}
                placeholder="987654321"
                maxLength={9}
                error={errors.telefono?.message}
              />
            </FormField>
            <FormField label="Apellido Paterno" required error={errors.apellidoPaterno?.message}>
              <Input
                {...register('apellidoPaterno')}
                placeholder="Apellido paterno"
                error={errors.apellidoPaterno?.message}
              />
            </FormField>
            <FormField label="Apellido Materno" required error={errors.apellidoMaterno?.message}>
              <Input
                {...register('apellidoMaterno')}
                placeholder="Apellido materno"
                error={errors.apellidoMaterno?.message}
              />
            </FormField>
            <FormField label="Fecha de Nacimiento" error={errors.fechaNacimiento?.message}>
              <Input
                type="date"
                {...register('fechaNacimiento')}
                error={errors.fechaNacimiento?.message}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setShowBenModal(false)
                setEditingBen(null)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={savingBen} iconLeft={<Plus className="h-4 w-4" />}>
              {editingBen ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Subir Documento */}
      <Modal
        open={showDocModal}
        onClose={() => {
          setShowDocModal(false)
          setDocFile(null)
          setDocTipo('OTRO')
        }}
        title="Subir Documento"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <FormField label="Tipo de Documento">
            <Select
              options={[
                { value: 'OTRO', label: 'Otro' },
                { value: 'DNI', label: 'DNI' },
                { value: 'CEDULA', label: 'Cédula' },
                { value: 'PASAPORTE', label: 'Pasaporte' },
                { value: 'PARTIDA_NAC', label: 'Partida de Nacimiento' },
                { value: 'CERTIFICADO', label: 'Certificado' },
                { value: 'CONTRATO', label: 'Contrato' },
              ]}
              value={docTipo}
              onChange={(e) => setDocTipo(e.target.value)}
            />
          </FormField>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Archivo</label>
            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted transition-colors hover:border-secondary hover:text-secondary"
            >
              <Upload className="h-5 w-5" />
              {docFile ? docFile.name : 'Seleccionar archivo'}
            </button>
            {docFile && <p className="mt-1 text-xs text-muted">{formatBytes(docFile.size)}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDocModal(false)
                setDocFile(null)
                setDocTipo('OTRO')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadDocumento}
              loading={uploadingDoc}
              disabled={!docFile}
              iconLeft={<Upload className="h-4 w-4" />}
            >
              Subir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal selector de fondo para ficha / historiales */}
      <Modal
        open={fondoSelectorFor !== null}
        onClose={() => setFondoSelectorFor(null)}
        title="Elegir Fondo"
        maxWidth="sm"
      >
        <p className="text-sm text-muted">
          El socio pertenece a varios fondos. Selecciona para cuál generar
          {fondoSelectorFor === 'aportes' && ' el historial de aportes'}
          {fondoSelectorFor === 'creditos' && ' el historial de créditos'}
          {fondoSelectorFor === 'ficha' && ' la ficha imprimible'}
          {fondoSelectorFor === 'cuenta' && ' el estado de cuenta'}.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {(socio.fondosSocios || [])
            .filter((rel) => rel.fondo && rel.fondo.estado === 'ACTIVO')
            .map((rel) => (
              <button
                key={rel.fondoId}
                disabled={printingFicha || printingAportes || printingCreditos || printingCuenta}
                onClick={() => {
                  setFondoSelectorFor(null)
                  if (fondoSelectorFor === 'aportes') {
                    generarAportes(rel.fondoId)
                  } else if (fondoSelectorFor === 'creditos') {
                    generarCreditos(rel.fondoId)
                  } else if (fondoSelectorFor === 'cuenta') {
                    generarCuenta(rel.fondoId)
                  } else {
                    generarFicha(rel.fondoId)
                  }
                }}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-all hover:border-secondary hover:bg-secondary/5 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-foreground">{rel.fondo?.nombre}</span>
                <span className="text-xs text-muted">Imprimir →</span>
              </button>
            ))}
        </div>
      </Modal>

      {/* Modal QR */}
      <Modal
        open={showQr}
        onClose={() => setShowQr(false)}
        title="Código QR del Socio"
        maxWidth="sm"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <QRCode
              value={`BANCO-SOLIDARIO-SOCIO:${socio.codigo}|DNI:${socio.dni}|NOMBRE:${socio.nombreCompleto}`}
              size={200}
              className="h-[200px] w-[200px]"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{socio.nombreCompleto}</p>
            <p className="text-xs text-muted">
              {socio.codigo} · DNI: {socio.dni}
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={benAEliminar !== null}
        onClose={() => setBenAEliminar(null)}
        onConfirm={() => benAEliminar !== null && handleDeleteBeneficiario(benAEliminar)}
        title="Eliminar beneficiario"
        message="Esta acción no se puede deshacer. El beneficiario se eliminará de forma permanente."
        confirmText="Eliminar"
      />

      <ConfirmDialog
        open={docAEliminar !== null}
        onClose={() => setDocAEliminar(null)}
        onConfirm={() => docAEliminar !== null && handleDeleteDocumento(docAEliminar)}
        title="Eliminar documento"
        message="Esta acción no se puede deshacer. Se eliminará el registro y el archivo adjunto."
        confirmText="Eliminar"
      />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function AportesSocioSection({ socioId }: { socioId: number }) {
  const { data, isLoading } = useAportes({ socioId, limit: 5 })
  const aportes = data?.data || []

  if (isLoading) return <p className="text-sm text-muted">Cargando aportes...</p>
  if (aportes.length === 0) return <p className="text-sm text-muted">No hay aportes registrados</p>

  const formatMonto = (monto: number, moneda = 'PEN') =>
    monto.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted/60">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Fondo
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Tipo
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Monto
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Período
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Fecha
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {aportes.map((a: Aporte) => (
            <tr key={a.id} className="transition-colors hover:bg-surface-muted/60">
              <td className="px-4 py-3">
                <Link
                  to={`/fondos/${a.fondo.id}`}
                  className="font-medium text-foreground hover:text-secondary"
                >
                  {a.fondo.nombre}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{a.tipo}</td>
              <td className="px-4 py-3 font-medium text-foreground">
                {formatMonto(a.monto, a.fondo.moneda)}
              </td>
              <td className="px-4 py-3 text-muted">{a.periodo}</td>
              <td className="px-4 py-3 text-muted">
                {format(new Date(a.fechaAporte), 'dd MMM yyyy', { locale: es })}
              </td>
              <td className="px-4 py-3 text-right">
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

function CreditosSocioSection({ socioId }: { socioId: number }) {
  const { data, isLoading } = useCreditos({ socioId, limit: 10 })
  const prestamos = data?.data || []

  if (isLoading) return <p className="text-sm text-muted">Cargando créditos...</p>
  if (prestamos.length === 0)
    return <p className="text-sm text-muted">No tiene créditos registrados</p>

  const formatMonto = (m: number) =>
    m.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-muted/60">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Fondo
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Monto
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Cuotas
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Pagadas
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Estado
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {prestamos.map((p: Prestamo) => (
            <tr key={p.id} className="transition-colors hover:bg-surface-muted/60">
              <td className="px-4 py-3">
                <Link
                  to={`/fondos/${p.fondo.id}`}
                  className="font-medium text-foreground hover:text-secondary"
                >
                  {p.fondo.nombre}
                </Link>
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{formatMonto(p.monto)}</td>
              <td className="px-4 py-3 text-muted">
                {p.numeroCuotas} × {formatMonto(p.montoCuota)}
              </td>
              <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                {p.totalCuotas || 0}/{p.numeroCuotas}
              </td>
              <td className="px-4 py-3">
                {p.estado === 'ACTIVO' && <Badge variant="blue">Activo</Badge>}
                {p.estado === 'PAGADO' && <Badge variant="green">Pagado</Badge>}
                {p.estado === 'ANULADO' && <Badge variant="gray">Anulado</Badge>}
              </td>
              <td className="px-4 py-3 text-right">
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
