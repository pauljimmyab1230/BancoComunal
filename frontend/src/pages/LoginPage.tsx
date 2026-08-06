import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, Landmark } from 'lucide-react'

import { useLogin } from '@/modules/configuracion/hooks/useConfiguracion'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, FormField } from '@/components/ui'

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
    if (result?.success && result.data?.token) {
      useAuthStore.getState().login(result.data.token, {
        name: result.data.user?.nombres || username,
        email: result.data.user?.correo || '',
      })
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <div className="hidden flex-1 flex-col justify-between bg-[#2563EB] p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Banco Comunal</p>
            <p className="text-xs text-blue-100">Sistema de Gestión Solidaria</p>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Administra los fondos rotatorios de tu comunidad de forma simple y segura.
          </h1>
          <p className="mt-4 text-blue-100">
            Socios, aportes, créditos y caja en un solo lugar, pensado para el desarrollo solidario.
          </p>
        </div>
        <p className="text-xs text-blue-200">© {new Date().getFullYear()} Banco Comunal</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB]">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-3 text-xl font-bold text-gray-900">Banco Comunal</h1>
            <p className="text-sm text-gray-500">Sistema de Gestión Solidaria</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="mt-1 text-sm text-gray-500">Ingrese sus credenciales para acceder al sistema.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
            >
              <FormField label="Usuario" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    className="pl-9"
                  />
                </div>
              </FormField>

              <FormField label="Contraseña" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    className="pl-9 pr-10"
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
              </FormField>

              <Button type="submit" className="w-full" loading={loginMutation.isPending} disabled={!username || !password}>
                Ingresar al Sistema
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            ¿Problemas para acceder? Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
