import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  PiggyBank,
  HandCoins,
  ScrollText,
  Receipt,
  Wallet,
  Building2,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { section: 'Gestión' },
  { to: '/socios', icon: Users, label: 'Socios' },
  { to: '/fondos', icon: Building2, label: 'Fondos Rotatorios' },
  { to: '/aportes', icon: HandCoins, label: 'Aportes' },
  { to: '/ahorros', icon: PiggyBank, label: 'Ahorros' },
  { to: '/creditos', icon: DollarSign, label: 'Créditos' },
  { section: 'Operaciones' },
  { to: '/caja', icon: Wallet, label: 'Caja' },
  { to: '/tesoreria', icon: Receipt, label: 'Tesorería' },
  { to: '/reportes', icon: ScrollText, label: 'Reportes' },
  { section: 'Administración' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
  { to: '/auditoria', icon: ShieldCheck, label: 'Auditoría' },
]

export default function AdminSidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: AdminSidebarProps) {
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F172A]">
      <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-white via-[#38BDF8] to-[#2563EB] bg-clip-text text-transparent">
            Banquito Solidario
          </span>
        )}
        {collapsed && (
          <span className="text-lg font-bold text-white">BS</span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="hidden items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            if ('section' in item) {
              return !collapsed ? (
                <li key={item.section} className="px-3 pt-4 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    {item.section}
                  </span>
                </li>
              ) : null
            }
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-[#2563EB]/20 text-[#38BDF8]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={`border-t border-white/10 p-4 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-semibold text-white">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Admin</p>
              <p className="truncate text-xs text-gray-500">admin@banquito.com</p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`hidden transition-all duration-300 lg:block ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-30" style={{ width: collapsed ? 68 : 256 }}>
          {sidebarContent}
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#0F172A]/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-40 w-64 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
