import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  HandCoins,
  ScrollText,
  Wallet,
  Building2,
  Settings,
  ShieldCheck,
  LogOut,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface AdminSidebarProps {
  expanded: boolean
  hovered: boolean
  onToggle: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const TODOS_LOS_ROLES = ['ADMIN', 'TESORERO', 'VOCAL'] as const

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/socios', icon: Users, label: 'Socios', roles: TODOS_LOS_ROLES },
  { to: '/fondos', icon: Building2, label: 'Fondos Rotatorios', roles: TODOS_LOS_ROLES },
  { to: '/aportes', icon: HandCoins, label: 'Aportes', roles: TODOS_LOS_ROLES },
  { to: '/creditos', icon: DollarSign, label: 'Créditos', roles: TODOS_LOS_ROLES },
  { to: '/caja', icon: Wallet, label: 'Caja', roles: TODOS_LOS_ROLES },
  { to: '/reportes', icon: ScrollText, label: 'Reportes', roles: TODOS_LOS_ROLES },
  { to: '/configuracion', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
  { to: '/auditoria', icon: ShieldCheck, label: 'Auditoría', roles: TODOS_LOS_ROLES },
]

export default function AdminSidebar({
  expanded,
  hovered,
  onToggle,
  onHoverStart,
  onHoverEnd,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role

  const isExpanded = expanded || hovered
  const sidebarWidth = isExpanded ? 240 : 68

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!userRole) return false
    return (item.roles as readonly string[]).includes(userRole)
  })

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-100">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Landmark className="h-5 w-5 text-white" />
        </div>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-base font-bold text-gray-900 whitespace-nowrap"
          >
            Banquito Solidario
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    !isExpanded ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-secondary/10 text-secondary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                title={!isExpanded ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        {isExpanded ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.name || 'Usuario'}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
              aria-label="Cerrar sesión"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
            aria-label="Cerrar sesión"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block" onMouseEnter={onHoverStart} onMouseLeave={onHoverEnd}>
        <div
          className="fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out"
          style={{ width: sidebarWidth }}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="hidden lg:flex fixed z-40 top-4 items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
        style={{ left: sidebarWidth + 8 }}
        aria-label={expanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
      >
        {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[240px] lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
