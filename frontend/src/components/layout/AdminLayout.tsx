import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

const titles: Record<string, string> = {
  '/socios': 'Socios',
  '/socios/nuevo': 'Nuevo Socio',
  '/fondos': 'Fondos Rotatorios',
  '/fondos/nuevo': 'Nuevo Fondo',
  '/aportes': 'Aportes',
  '/aportes/nuevo': 'Nuevo Aporte',
  '/creditos': 'Créditos',
  '/creditos/nuevo': 'Nuevo Crédito',
  '/caja': 'Caja',
  '/caja/nueva': 'Nueva Caja',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
  '/auditoria': 'Auditoría',
}

function getTitle(pathname: string): string | undefined {
  if (titles[pathname]) return titles[pathname]
  const segments = pathname.split('/')
  if (segments.length >= 3) {
    const base = '/' + segments[1]
    return titles[base]
  }
  return undefined
}

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const title = getTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          title={title}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
