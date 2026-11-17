import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, ChevronRight, User, Settings, LogOut, Key, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useChangeOwnPassword } from '@/modules/configuracion/hooks/useConfiguracion'
import { Button, FormField, Input, Modal, ThemeToggle } from '@/components/ui'
import { MENSAJE_POLITICA_PASSWORD, esPasswordSegura } from '@/lib/passwordPolicy'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  title?: string
}

export default function AdminHeader({ onToggleSidebar, title }: AdminHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const displayName = user?.name || 'Admin'
  const displayEmail = user?.email || 'usuario@banquito.com'
  const { pathname } = useLocation()
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setUserMenuOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    navigate('/login', { replace: true })
  }

  const cambioPasswordForzado = searchParams.get('changePassword') === 'true'

  const cerrarModalPassword = () => {
    if (cambioPasswordForzado) return
    setPasswordModalOpen(false)
  }

  const finalizarCambioPassword = () => {
    setPasswordModalOpen(false)
    if (cambioPasswordForzado) {
      const restantes = new URLSearchParams(searchParams)
      restantes.delete('changePassword')
      setSearchParams(restantes, { replace: true })
    }
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

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-surface/80 px-4 backdrop-blur-xl print:hidden sm:px-6">
      <div className="flex w-full items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <nav className="flex items-center gap-1 text-sm text-muted">
            <Link to="/" className="transition-colors hover:text-secondary">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{title}</span>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            className="relative flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-hover"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-xs font-semibold text-white">
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
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-pop)]"
                >
                  <div className="border-b border-border-subtle px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted">{displayEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordModalOpen(true)
                        setUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                    >
                      <Key className="h-4 w-4" />
                      Cambiar Contraseña
                    </button>
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                    >
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
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

      <ChangePasswordModal
        open={passwordModalOpen || cambioPasswordForzado}
        forzado={cambioPasswordForzado}
        onClose={cerrarModalPassword}
        onExito={finalizarCambioPassword}
      />
    </header>
  )
}

function ChangePasswordModal({
  open,
  forzado,
  onClose,
  onExito,
}: {
  open: boolean
  forzado: boolean
  onClose: () => void
  onExito: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const changePassword = useChangeOwnPassword()

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) return
    if (!esPasswordSegura(newPassword)) return

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          onExito()
        },
      }
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Cambiar Contraseña" maxWidth="sm">
      <div className="space-y-4">
        {forzado && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Un administrador restableció tu contraseña. Debes cambiarla para continuar.
          </p>
        )}

        <FormField label="Contraseña Actual" required>
          {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
            <div className="relative">
              <Input
                id={id}
                aria-describedby={descritoPor}
                aria-invalid={invalido}
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese su contraseña actual"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </FormField>

        <FormField label="Nueva Contraseña" required>
          {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
            <div className="relative">
              <Input
                id={id}
                aria-describedby={descritoPor}
                aria-invalid={invalido}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={MENSAJE_POLITICA_PASSWORD}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </FormField>

        {newPassword && !esPasswordSegura(newPassword) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{MENSAJE_POLITICA_PASSWORD}</p>
        )}

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
          {!forzado && (
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            loading={changePassword.isPending}
            disabled={
              !currentPassword ||
              !newPassword ||
              newPassword !== confirmPassword ||
              !esPasswordSegura(newPassword)
            }
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
