import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, Landmark } from 'lucide-react'

import { useLogin } from '@/modules/configuracion/hooks/useConfiguracion'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, FormField, Card } from '@/components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const loginMutation = useLogin()

  const from = (location.state as { from?: string } | null)?.from || '/'

  const handleLogin = async () => {
    if (!username || !password) return
    const result = await loginMutation.mutateAsync({ username, password })
    if (result?.success && result.data?.user) {
      const u = result.data.user
      useAuthStore.getState().login({
        name: u.nombres || username,
        email: u.correo || '',
        role: u.rol,
        cambiarPassword: u.cambiarPassword,
      })
      if (result.data.user?.cambiarPassword) {
        navigate('/?changePassword=true', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Landmark className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Banquito Solidario</h1>
          <p className="text-sm text-gray-500">Ingrese sus credenciales</p>
        </div>

        <Card padding="md">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <FormField label="Usuario" required>
              {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        <p className="mt-6 text-center text-xs text-gray-400">
          ¿Problemas para acceder? Contacte al administrador.
        </p>
      </div>
    </div>
  )
}
