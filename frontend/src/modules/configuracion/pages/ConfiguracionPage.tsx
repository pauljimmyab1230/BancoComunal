import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Building2, ShieldCheck, Users } from 'lucide-react'
import { Badge, ConfirmDialog, SectionHeader } from '@/components/ui'
import { useResumenConfiguracion } from '../hooks/useConfiguracion'
import UsuariosTab from '../components/UsuariosTab'
import ConceptosTab from '../components/ConceptosTab'
import OrganizacionTab from '../components/OrganizacionTab'
import SeguridadTab from '../components/SeguridadTab'

const TABS = ['usuarios', 'conceptos', 'organizacion', 'seguridad'] as const
type TabConfiguracion = (typeof TABS)[number]

function esTabValida(valor: string | null): valor is TabConfiguracion {
  return valor !== null && (TABS as readonly string[]).includes(valor)
}

export default function ConfiguracionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabConfiguracion = esTabValida(tabParam) ? tabParam : 'usuarios'

  const [organizacionConCambios, setOrganizacionConCambios] = useState(false)
  const [tabPendiente, setTabPendiente] = useState<TabConfiguracion | null>(null)

  const {
    data: resumen,
    isLoading: cargandoResumen,
    isError: errorResumen,
    error: detalleErrorResumen,
    refetch: recargarResumen,
  } = useResumenConfiguracion()

  const aplicarTab = (tab: TabConfiguracion) => {
    setSearchParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos)
        if (tab === 'usuarios') siguientes.delete('tab')
        else siguientes.set('tab', tab)
        return siguientes
      },
      { replace: true }
    )
  }

  const cambiarTab = (tab: TabConfiguracion) => {
    if (tab === activeTab) return
    if (activeTab === 'organizacion' && organizacionConCambios) {
      setTabPendiente(tab)
      return
    }
    aplicarTab(tab)
  }

  const tabs = [
    {
      id: 'usuarios' as const,
      label: 'Usuarios',
      icon: Users,
      total: resumen?.usuarios.total,
    },
    {
      id: 'conceptos' as const,
      label: 'Conceptos de caja',
      icon: BookOpen,
      total: resumen?.conceptos.total,
    },
    {
      id: 'organizacion' as const,
      label: 'Organización',
      icon: Building2,
      total: undefined,
    },
    {
      id: 'seguridad' as const,
      label: 'Seguridad',
      icon: ShieldCheck,
      total: undefined,
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title="Configuración"
          description="Gestión de usuarios, catálogo de caja y parámetros del sistema"
        />
        <Badge variant="purple" className="self-start">
          <ShieldCheck className="h-3.5 w-3.5" />
          Solo administradores
        </Badge>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de configuración"
        className="mb-6 inline-flex flex-wrap rounded-xl border border-border bg-surface p-1"
      >
        {tabs.map((tab) => {
          const Icono = tab.icon
          const activa = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activa}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => cambiarTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activa
                  ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {tab.label}
              {tab.total !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    activa ? 'bg-white/20 text-white' : 'bg-surface-muted text-subtle'
                  }`}
                >
                  {tab.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="focus-visible:outline-none"
      >
        {activeTab === 'usuarios' && (
          <UsuariosTab
            resumen={resumen}
            cargandoResumen={cargandoResumen}
            errorResumen={errorResumen ? detalleErrorResumen : undefined}
            recargarResumen={recargarResumen}
          />
        )}
        {activeTab === 'conceptos' && (
          <ConceptosTab
            resumen={resumen}
            cargandoResumen={cargandoResumen}
            errorResumen={errorResumen ? detalleErrorResumen : undefined}
            recargarResumen={recargarResumen}
          />
        )}
        {activeTab === 'organizacion' && (
          <OrganizacionTab onDirtyChange={setOrganizacionConCambios} />
        )}
        {activeTab === 'seguridad' && <SeguridadTab />}
      </div>

      <ConfirmDialog
        open={tabPendiente !== null}
        onClose={() => setTabPendiente(null)}
        onConfirm={() => {
          if (tabPendiente) aplicarTab(tabPendiente)
          setTabPendiente(null)
          setOrganizacionConCambios(false)
        }}
        title="Cambios sin guardar"
        message="La organización tiene cambios sin guardar. Si cambias de pestaña se descartarán. ¿Deseas continuar?"
        confirmText="Descartar y cambiar"
        cancelText="Seguir editando"
      />
    </div>
  )
}
