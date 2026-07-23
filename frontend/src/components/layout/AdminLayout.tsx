import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

const titles: Record<string, string> = {
  '/socios': 'Socios',
  '/socios/nuevo': 'Nuevo Socio',
  '/fondos': 'Fondos Rotatorios',
  '/aportes': 'Aportes',
  '/ahorros': 'Ahorros',
  '/creditos': 'Créditos',
  '/caja': 'Caja',
  '/tesoreria': 'Tesorería',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
  '/auditoria': 'Auditoría',
}

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const title = titles[location.pathname]

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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
