import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Banknote, User, Building2, Calendar, FileText } from 'lucide-react'
import { useAporte } from '../hooks/useAportes'
import { Button, SectionHeader, Card, Badge, LoadingSpinner } from '@/components/ui'
import type { Aporte } from '../types'

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'OBLIGATORIO': return <Badge variant="blue">Obligatorio</Badge>
    case 'EXTRAORDINARIO': return <Badge variant="purple">Extraordinario</Badge>
    case 'VOLUNTARIO': return <Badge variant="green">Voluntario</Badge>
    default: return <Badge>{tipo}</Badge>
  }
}

const formatMonto = (monto: number, moneda = 'PEN') => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(monto)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function AporteDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useAporte(Number(id))

  if (isLoading) {
    return <LoadingSpinner />
  }

  const aporte = data?.data as Aporte | undefined
  if (!aporte) {
    return <div className="text-center py-20 text-gray-500">Aporte no encontrado</div>
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Detalle del Aporte"
          description={`Aporte #${aporte.id} - ${formatDate(aporte.fechaAporte)}`}
        />
        <div className="flex gap-2">
          <Button as="link" to="/aportes" variant="secondary" iconLeft={<ArrowLeft className="h-4 w-4" />}>
            Volver
          </Button>
          {aporte.estado === 'ACTIVO' && (
            <Button as="link" to={`/aportes/${id}/editar`}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-[#111827]">Información del Aporte</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tipo</span>
              {tipoBadge(aporte.tipo)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Monto</span>
              <span className="text-xl font-bold text-[#111827]">{formatMonto(aporte.monto, aporte.fondo.moneda)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Período</span>
              <span className="flex items-center gap-1 text-sm font-medium text-[#111827]">
                <Calendar className="h-4 w-4 text-gray-400" />
                {aporte.periodo}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Fecha</span>
              <span className="text-sm text-[#111827]">{formatDate(aporte.fechaAporte)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Método de Pago</span>
              <span className="text-sm font-medium text-[#111827]">{aporte.metodoPago}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Estado</span>
              {aporte.estado === 'ANULADO'
                ? <Badge variant="gray">Anulado</Badge>
                : <Badge variant="green">Activo</Badge>
              }
            </div>
            {aporte.comprobante && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Comprobante</span>
                <span className="flex items-center gap-1 text-sm text-[#111827]">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {aporte.comprobante}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="mb-4 text-lg font-semibold text-[#111827]">Relacionado</h3>
          <div className="space-y-4">
            <Link to={`/socios/${aporte.socio.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-[#2563EB]/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827]">{aporte.socio.nombres} {aporte.socio.apellidoPaterno}</p>
                <p className="text-xs text-gray-500">{aporte.socio.codigo} · {aporte.socio.dni}</p>
              </div>
            </Link>

            <Link to={`/fondos/${aporte.fondo.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-[#2563EB]/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111827]">{aporte.fondo.nombre}</p>
                <p className="text-xs text-gray-500">{aporte.fondo.moneda}</p>
              </div>
            </Link>

            {aporte.registrador && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111827]">Registrado por</p>
                  <p className="text-xs text-gray-500">
                    {aporte.registrador.nombres} {aporte.registrador.apellidoPaterno}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {aporte.observacion && (
          <Card padding="lg" className="md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-[#111827]">Observación</h3>
            <p className="text-sm text-gray-600">{aporte.observacion}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
