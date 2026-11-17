import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  HandCoins,
  Calculator,
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
  { to: '/cotizaciones', icon: Calculator, label: 'Cotizaciones', roles: TODOS_LOS_ROLES },
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
    <div className="flex h-full flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-accent shadow-sm shadow-secondary/30">
          <Landmark className="h-5 w-5 text-white" />
        </div>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="whitespace-nowrap text-base font-bold text-foreground"
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
                      ? 'bg-secondary/12 text-secondary shadow-sm shadow-secondary/10'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground'
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
      <div className="border-t border-border-subtle p-3">
        {isExpanded ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name || 'Usuario'}
              </p>
              <p className="truncate text-xs text-muted">{user?.email || ''}</p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-subtle transition-colors hover:bg-surface-hover hover:text-red-600"
              aria-label="Cerrar sesión"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-subtle transition-colors hover:bg-surface-hover hover:text-red-600"
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
      <aside
        className="hidden lg:block print:hidden"
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
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
        className="fixed top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted shadow-sm transition-all duration-300 hover:bg-surface-hover hover:text-foreground lg:flex"
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
          <aside className="fixed inset-y-0 left-0 z-40 w-[240px] lg:hidden print:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
