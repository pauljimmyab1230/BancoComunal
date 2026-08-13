import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useChangeOwnPassword } from '@/modules/configuracion/hooks/useConfiguracion'
import { Button, FormField, Input, Modal } from '@/components/ui'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  title?: string
}

export default function AdminHeader({ onToggleSidebar, title }: AdminHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const displayName = user?.name || 'Admin'
  const displayEmail = user?.email || 'usuario@banquito.com'

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setUserMenuOpen(false)
  }, [useLocation().pathname])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex w-full items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link to="/" className="transition-colors hover:text-[#2563EB]">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#111827]">{title}</span>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="relative flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                >
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-medium text-[#111827]">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setPasswordModalOpen(true); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Key className="h-4 w-4" />
                      Cambiar Contraseña
                    </button>
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </header>
  )
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const changePassword = useChangeOwnPassword()

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      return
    }
    if (newPassword.length < 6) return

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          onClose()
        },
      }
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Cambiar Contraseña" maxWidth="sm">
      <div className="space-y-4">
        <FormField label="Contraseña Actual" required>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingrese su contraseña actual"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Nueva Contraseña" required>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirmar Nueva Contraseña" required>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita la nueva contraseña"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
          )}
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={changePassword.isPending}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
