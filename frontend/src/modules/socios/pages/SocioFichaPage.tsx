import { useParams } from 'react-router-dom'
import { useSocio } from '../hooks/useSocios'
import { LoadingSpinner, Button, Badge } from '@/components/ui'
import { Printer, ArrowLeft, User, Phone, Users } from 'lucide-react'

const estadoCivilMap: Record<string, string> = {
  S: 'Soltero',
  C: 'Casado',
  V: 'Viudo',
  D: 'Divorciado',
}

export default function SocioFichaPage() {
  const { id } = useParams()
  const { data, isLoading } = useSocio(Number(id))
  const socio = data?.data
  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando..." />
      </div>
    )
  }

  if (!socio) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Socio no encontrado</p>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print mb-6 flex items-center gap-4">
        <Button variant="ghost" as="link" to={`/socios/${socio.id}`} iconLeft={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
        <div className="flex-1" />
        <Button onClick={handlePrint} iconLeft={<Printer className="h-4 w-4" />}>
          Imprimir / Guardar PDF
        </Button>
      </div>

      <div
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print:border-none print:shadow-none"
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#2563EB] px-8 py-10 text-white">
          <div className="flex items-start gap-8">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20">
              {socio.fotoUrl ? (
                <img src={socio.fotoUrl} alt={socio.nombreCompleto} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <User className="h-12 w-12 text-white/60" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{socio.nombreCompleto}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/70">
                <span>Código: <strong className="text-white">{socio.codigo}</strong></span>
                <span>DNI: <strong className="text-white">{socio.dni}</strong></span>
                <span>
                  Estado:
                  <Badge variant={socio.estado === 'A' ? 'green' : 'red'} className="ml-1">
                    {socio.estado === 'A' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </span>
              </div>

              {/* QR Code */}
              <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white p-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=BANCO-SOLIDARIO-SOCIO:${socio.codigo}|DNI:${socio.dni}|NOMBRE:${socio.nombreCompleto}`}
                  alt="QR Code"
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="grid gap-8 p-8 sm:grid-cols-2">
          {/* Datos Personales */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
              <User className="h-4 w-4" />
              Datos Personales
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Nombres</span>
                <span className="text-sm font-medium text-[#111827]">{socio.nombres}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Apellido Paterno</span>
                <span className="text-sm font-medium text-[#111827]">{socio.apellidoPaterno}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Apellido Materno</span>
                <span className="text-sm font-medium text-[#111827]">{socio.apellidoMaterno}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Género</span>
                <span className="text-sm font-medium text-[#111827]">{socio.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Fecha de Nacimiento</span>
                <span className="text-sm font-medium text-[#111827]">
                  {socio.fechaNacimiento ? new Date(socio.fechaNacimiento).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Estado Civil</span>
                <span className="text-sm font-medium text-[#111827]">{estadoCivilMap[socio.estadoCivil || ''] || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Fecha de Ingreso</span>
                <span className="text-sm font-medium text-[#111827]">{new Date(socio.fechaIngreso).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
              <Phone className="h-4 w-4" />
              Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Teléfono</span>
                <span className="text-sm font-medium text-[#111827]">{socio.telefono || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Correo Electrónico</span>
                <span className="text-sm font-medium text-[#111827]">{socio.email || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Dirección</span>
                <span className="text-sm font-medium text-[#111827]">{socio.direccion || '—'}</span>
              </div>
            </div>

            {/* Beneficiarios */}
            {socio.beneficiarios && socio.beneficiarios.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
                  <Users className="h-4 w-4" />
                  Beneficiarios
                </h3>
                <div className="space-y-2">
                  {socio.beneficiarios.map((ben, i) => (
                    <div key={ben.id} className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium text-[#111827]">
                        {i + 1}. {ben.nombres} {ben.apellidoPaterno} {ben.apellidoMaterno}
                      </p>
                      <p className="text-xs text-gray-500">
                        DNI: {ben.dni} · {ben.parentesco}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-4 text-center text-xs text-gray-400">
          Documento generado por Banquito Solidario · {new Date().toLocaleDateString()} · www.banquitosolidario.com
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  )
}
