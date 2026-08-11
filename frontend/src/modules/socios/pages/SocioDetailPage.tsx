import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Pencil, User, Phone, Mail, MapPin, Calendar, Shield,
  FileText, Users, Camera, QrCode, Download, Plus, Trash2, Printer,
  HandCoins, Landmark, Upload,
} from 'lucide-react'
import { useSocio } from '../hooks/useSocios'
import { useAportes } from '@/modules/aportes/hooks/useAportes'
import { useCreditos } from '@/modules/creditos/hooks/useCreditos'
import { Button, Card, Badge, LoadingSpinner, Modal, Input, Select, FormField, QRCode } from '@/components/ui'
import { socioApi } from '../api/socioApi'
import { getErrorMessage, openProtectedPdf } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { es } from 'date-fns/locale'

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

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function SocioDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useSocio(Number(id))
  const socio = data?.data
  const queryClient = useQueryClient()

  // Beneficiario modal
  const [showBenModal, setShowBenModal] = useState(false)
  const [editingBen, setEditingBen] = useState<any>(null)
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
  const [fondoSelectorFor, setFondoSelectorFor] = useState<'ficha' | 'aportes' | 'creditos' | 'cuenta' | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BeneficiarioForm>({
    resolver: zodResolver(beneficiarioSchema),
    defaultValues: {
      dni: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
      parentesco: '', telefono: '', fechaNacimiento: '',
    },
  })

  const openAddBen = () => {
    setEditingBen(null)
    reset({ dni: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', parentesco: '', telefono: '', fechaNacimiento: '' })
    setShowBenModal(true)
  }

  const openEditBen = (ben: any) => {
    setEditingBen(ben)
    reset({
      dni: ben.dni, nombres: ben.nombres, apellidoPaterno: ben.apellidoPaterno,
      apellidoMaterno: ben.apellidoMaterno, parentesco: ben.parentesco,
      telefono: ben.telefono || '', fechaNacimiento: ben.fechaNacimiento?.split('T')[0] || '',
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
      toast.error(getErrorMessage(error, editingBen ? 'Error al actualizar beneficiario' : 'Error al agregar beneficiario'))
    } finally {
      setSavingBen(false)
    }
  }

  const handleDeleteBeneficiario = async (beneficiarioId: number) => {
    if (!socio) return
    try {
      await socioApi.deleteBeneficiario(socio.id, beneficiarioId)
      queryClient.invalidateQueries({ queryKey: ['socio', socio.id] })
      toast.success('Beneficiario eliminado')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al eliminar beneficiario'))
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

  if (!socio) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Socio no encontrado</p>
        <Button as="link" to="/socios" variant="ghost" iconLeft={<ArrowLeft className="h-4 w-4" />} className="mt-4">
          Volver a Socios
        </Button>
      </div>
    )
  }

  const estadoBadge = socio.estado === 'A'
    ? <Badge variant="green">Activo</Badge>
    : <Badge variant="red">Inactivo</Badge>

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-[#111827]">{value}</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
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
          {printingFicha ? 'Generando...' : 'Ficha Imprimible'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleImprimirCuenta}
          disabled={printingCuenta}
          iconLeft={<Printer className="h-4 w-4" />}
        >
          {printingCuenta ? 'Generando...' : 'Estado de Cuenta'}
        </Button>
        <Button variant="secondary" as="link" to={`/socios/${socio.id}/editar`} iconLeft={<Pencil className="h-4 w-4" />}>
          Editar
        </Button>
      </div>

      {/* Header */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB]/10">
            {socio.fotoUrl ? (
              <img src={socio.fotoUrl} alt={socio.nombreCompleto} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-[#2563EB]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827]">{socio.nombreCompleto}</h1>
              {estadoBadge}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Código: <span className="font-medium text-[#111827]">{socio.codigo}</span>
              {' · '}DNI: <span className="font-medium text-[#111827]">{socio.dni}</span>
            </p>
          </div>
          <button
            onClick={() => setShowQr(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#111827] transition-all hover:bg-gray-50"
          >
            <QrCode className="h-5 w-5" />
            <span className="hidden sm:inline">QR</span>
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos Personales */}
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Datos Personales</h3>
          </div>
          <div className="space-y-4">
            <InfoRow icon={User} label="Género" value={socio.genero === 'M' ? 'Masculino' : 'Femenino'} />
            <InfoRow icon={Calendar} label="Fecha de Nacimiento" value={socio.fechaNacimiento ? new Date(socio.fechaNacimiento).toLocaleDateString() : '—'} />
            <InfoRow icon={Shield} label="Estado Civil" value={{ S: 'Soltero', C: 'Casado', V: 'Viudo', D: 'Divorciado' }[socio.estadoCivil || ''] || '—'} />
            <InfoRow icon={Calendar} label="Ingreso" value={new Date(socio.fechaIngreso).toLocaleDateString()} />
          </div>
        </Card>

        {/* Contacto */}
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#2563EB]" />
            <h3 className="font-semibold text-[#111827]">Contacto</h3>
          </div>
          <div className="space-y-4">
            <InfoRow icon={Phone} label="Teléfono" value={socio.telefono || '—'} />
            <InfoRow icon={Mail} label="Correo" value={socio.email || '—'} />
            <InfoRow icon={MapPin} label="Dirección" value={socio.direccion || '—'} />
          </div>
        </Card>

        {/* Documentos */}
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2563EB]" />
              <h3 className="font-semibold text-[#111827]">Documentos</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowDocModal(true)} iconLeft={<Upload className="h-4 w-4" />}>
              Subir
            </Button>
          </div>
          <div className="space-y-3">
            {(!socio.documentos || socio.documentos.length === 0) ? (
              <p className="text-sm text-gray-400">Sin documentos adjuntos</p>
            ) : (
              socio.documentos.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <FileText className="h-8 w-8 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{doc.nombreArchivo}</p>
                    <p className="text-xs text-gray-500">{doc.tipoDocumento} · {formatBytes(doc.tamaño)}</p>
                  </div>
                  <a
                    href={doc.rutaArchivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-gray-400 hover:text-[#2563EB]"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocumento(doc.id)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Beneficiarios */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#2563EB]" />
              <h3 className="font-semibold text-[#111827]">Beneficiarios</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={openAddBen} iconLeft={<Plus className="h-4 w-4" />}>
              Agregar
            </Button>
          </div>
          {(!socio.beneficiarios || socio.beneficiarios.length === 0) ? (
            <p className="text-sm text-gray-400">No tiene beneficiarios registrados</p>
          ) : (
            <div className="space-y-3">
              {socio.beneficiarios.map((ben) => (
                <div key={ben.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                    {ben.nombres.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111827]">
                      {ben.nombres} {ben.apellidoPaterno} {ben.apellidoMaterno}
                    </p>
                    <p className="text-xs text-gray-500">
                      DNI: {ben.dni} · {ben.parentesco}
                      {ben.telefono && ` · ${ben.telefono}`}
                      {ben.fechaNacimiento && ` · Nac: ${new Date(ben.fechaNacimiento).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditBen(ben)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBeneficiario(ben.id)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Fondos */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#2563EB]" />
              <h3 className="font-semibold text-[#111827]">Fondos</h3>
            </div>
            <Button variant="secondary" size="sm" as="link" to="/fondos">
              Ver todos
            </Button>
          </div>
          {(!socio.fondosSocios || socio.fondosSocios.length === 0) ? (
            <p className="text-sm text-gray-400">No pertenece a ningún fondo</p>
          ) : (
            <div className="space-y-3">
              {socio.fondosSocios.map((fs) => (
                <div key={fs.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/fondos/${fs.fondo?.id ?? fs.fondoId}`} className="text-sm font-medium text-[#111827] hover:text-[#2563EB]">
                      {fs.fondo?.nombre ?? `Fondo #${fs.fondoId}`}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {fs.numeroSocio ? `N° ${fs.numeroSocio}` : ''}
                      {fs.cargo ? ` · ${fs.cargo}` : ''}
                      {fs.nivel ? ` · ${fs.nivel}` : ''}
                      {fs.fechaIngreso ? ` · Ingreso: ${new Date(fs.fechaIngreso).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Aportes */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-[#2563EB]" />
              <h3 className="font-semibold text-[#111827]">Aportes</h3>
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

        {/* Créditos */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-[#2563EB]" />
              <h3 className="font-semibold text-[#111827]">Créditos</h3>
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
      </div>

      {/* Modal Beneficiario (Add/Edit) */}
      <Modal open={showBenModal} onClose={() => { setShowBenModal(false); setEditingBen(null); reset() }} title={editingBen ? 'Editar Beneficiario' : 'Agregar Beneficiario'} maxWidth="lg">
        <form onSubmit={handleSubmit(handleSaveBeneficiario)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="DNI" required error={errors.dni?.message}>
              <Input {...register('dni')} placeholder="12345678" maxLength={8} error={errors.dni?.message} />
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
              <Input {...register('nombres')} placeholder="Nombres" error={errors.nombres?.message} />
            </FormField>
            <FormField label="Teléfono" error={errors.telefono?.message}>
              <Input {...register('telefono')} placeholder="987654321" maxLength={9} error={errors.telefono?.message} />
            </FormField>
            <FormField label="Apellido Paterno" required error={errors.apellidoPaterno?.message}>
              <Input {...register('apellidoPaterno')} placeholder="Apellido paterno" error={errors.apellidoPaterno?.message} />
            </FormField>
            <FormField label="Apellido Materno" required error={errors.apellidoMaterno?.message}>
              <Input {...register('apellidoMaterno')} placeholder="Apellido materno" error={errors.apellidoMaterno?.message} />
            </FormField>
            <FormField label="Fecha de Nacimiento" error={errors.fechaNacimiento?.message}>
              <Input type="date" {...register('fechaNacimiento')} error={errors.fechaNacimiento?.message} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setShowBenModal(false); setEditingBen(null); reset() }}>
              Cancelar
            </Button>
            <Button type="submit" loading={savingBen} iconLeft={<Plus className="h-4 w-4" />}>
              {editingBen ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Subir Documento */}
      <Modal open={showDocModal} onClose={() => { setShowDocModal(false); setDocFile(null); setDocTipo('OTRO') }} title="Subir Documento" maxWidth="sm">
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
            <label className="mb-1 block text-xs font-medium text-gray-500">Archivo</label>
            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              <Upload className="h-5 w-5" />
              {docFile ? docFile.name : 'Seleccionar archivo'}
            </button>
            {docFile && (
              <p className="mt-1 text-xs text-gray-400">{formatBytes(docFile.size)}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowDocModal(false); setDocFile(null); setDocTipo('OTRO') }}>
              Cancelar
            </Button>
            <Button onClick={handleUploadDocumento} loading={uploadingDoc} disabled={!docFile} iconLeft={<Upload className="h-4 w-4" />}>
              Subir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal selector de fondo para ficha / historiales */}
      <Modal open={fondoSelectorFor !== null} onClose={() => setFondoSelectorFor(null)} title="Elegir Fondo" maxWidth="sm">
        <p className="text-sm text-gray-500">
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
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition-all hover:border-[#2563EB] hover:bg-[#2563EB]/5 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-[#111827]">{rel.fondo?.nombre}</span>
                <span className="text-xs text-gray-400">Imprimir →</span>
              </button>
            ))}
        </div>
      </Modal>

      {/* Modal QR */}
      <Modal open={showQr} onClose={() => setShowQr(false)} title="Código QR del Socio" maxWidth="sm">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <QRCode
              value={`BANCO-SOLIDARIO-SOCIO:${socio.codigo}|DNI:${socio.dni}|NOMBRE:${socio.nombreCompleto}`}
              size={200}
              className="h-[200px] w-[200px]"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#111827]">{socio.nombreCompleto}</p>
            <p className="text-xs text-gray-500">{socio.codigo} · DNI: {socio.dni}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AportesSocioSection({ socioId }: { socioId: number }) {
  const { data, isLoading } = useAportes({ socioId, limit: 5 })
  const aportes = data?.data || []

  if (isLoading) return <p className="text-sm text-gray-400">Cargando aportes...</p>
  if (aportes.length === 0) return <p className="text-sm text-gray-400">No hay aportes registrados</p>

  const formatMonto = (monto: number, moneda = 'PEN') => monto.toLocaleString('es-PE', { style: 'currency', currency: moneda })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fondo</th>
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
                <Link to={`/fondos/${a.fondo.id}`} className="font-medium text-[#111827] hover:text-[#2563EB]">{a.fondo.nombre}</Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{a.tipo}</td>
              <td className="px-4 py-3 font-medium text-[#111827]">{formatMonto(a.monto, a.fondo.moneda)}</td>
              <td className="px-4 py-3 text-gray-600">{a.periodo}</td>
              <td className="px-4 py-3 text-gray-600">{format(new Date(a.fechaAporte), 'dd MMM yyyy', { locale: es })}</td>
              <td className="px-4 py-3 text-right">
                <Link to={`/aportes/${a.id}`} className="text-xs font-medium text-[#2563EB] hover:underline">Detalle</Link>
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

  if (isLoading) return <p className="text-sm text-gray-400">Cargando créditos...</p>
  if (prestamos.length === 0) return <p className="text-sm text-gray-400">No tiene créditos registrados</p>

  const formatMonto = (m: number) => m.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fondo</th>
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
                <Link to={`/fondos/${p.fondo.id}`} className="font-medium text-[#111827] hover:text-[#2563EB]">{p.fondo.nombre}</Link>
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
