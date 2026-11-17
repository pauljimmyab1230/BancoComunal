import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, Landmark, ShieldCheck, ArrowLeft } from 'lucide-react'

import { useLogin, useVerifyTwoFactorLogin } from '@/modules/configuracion/hooks/useConfiguracion'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, FormField, Card, ThemeToggle } from '@/components/ui'

interface UsuarioLogin {
  id: number
  username: string
  nombres?: string
  correo?: string
  rol: string
  cambiarPassword?: boolean
  twoFactorEnabled?: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const loginMutation = useLogin()
  const verifyMutation = useVerifyTwoFactorLogin()

  const from = (location.state as { from?: string } | null)?.from || '/'

  const finalizarLogin = (u: UsuarioLogin) => {
    useAuthStore.getState().login({
      id: u.id,
      username: u.username,
      name: u.nombres || username,
      email: u.correo || '',
      role: u.rol,
      cambiarPassword: u.cambiarPassword,
      twoFactorEnabled: u.twoFactorEnabled,
    })
    if (u.cambiarPassword) {
      navigate('/?changePassword=true', { replace: true })
    } else {
      navigate(from, { replace: true })
    }
  }

  const handleLogin = async () => {
    if (!username || !password) return
    const result = await loginMutation.mutateAsync({ username, password })
    if (!result?.success) return

    if (result.data?.requireTwoFactor) {
      setTwoFactorToken(result.data.twoFactorToken)
      return
    }
    if (result.data?.user) finalizarLogin(result.data.user)
  }

  const handleVerify = async () => {
    if (!twoFactorToken || !twoFactorCode) return
    const result = await verifyMutation.mutateAsync({ twoFactorToken, code: twoFactorCode })
    if (result?.success && result.data?.user) finalizarLogin(result.data.user)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-accent shadow-lg shadow-secondary/30">
            <Landmark className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">Banquito Solidario</h1>
          <p className="text-sm text-muted">Fondos rotatorios comunitarios</p>
        </div>

        <motion.div
          key={twoFactorToken ? '2fa' : 'login'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {twoFactorToken ? (
            <Card padding="lg">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleVerify()
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-foreground">
                    Verificación en dos pasos
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                  </p>
                </div>

                <FormField label="Código de verificación" required>
                  <Input
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    className="text-center font-mono text-lg tracking-[0.5em]"
                  />
                </FormField>

                <Button
                  type="submit"
                  className="w-full"
                  loading={verifyMutation.isPending}
                  disabled={twoFactorCode.length !== 6}
                >
                  Verificar
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorToken(null)
                    setTwoFactorCode('')
                  }}
                  className="flex w-full items-center justify-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Volver al inicio de sesión
                </button>
              </form>
            </Card>
          ) : (
            <Card padding="lg">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleLogin()
                }}
              >
                <div className="mb-1">
                  <h2 className="text-lg font-semibold text-foreground">Bienvenido</h2>
                  <p className="text-sm text-muted">Inicia sesión para continuar</p>
                </div>

                <FormField label="Usuario" required>
                  {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                      <Input
                        id={id}
                        aria-describedby={descritoPor}
                        aria-invalid={invalido}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ingrese su usuario"
                        className="pl-9"
                        autoComplete="username"
                      />
                    </div>
                  )}
                </FormField>

                <FormField label="Contraseña" required>
                  {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                      <Input
                        id={id}
                        aria-describedby={descritoPor}
                        aria-invalid={invalido}
                        type={show ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese su contraseña"
                        className="pl-9 pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle transition-colors hover:text-foreground"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {show ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )}
                </FormField>

                <Button
                  type="submit"
                  className="w-full"
                  loading={loginMutation.isPending}
                  disabled={!username || !password}
                >
                  Ingresar
                </Button>
              </form>
            </Card>
          )}

          <p className="mt-6 text-center text-xs text-subtle">
            ¿Problemas para acceder? Contacte al administrador.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
