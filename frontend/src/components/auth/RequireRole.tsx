import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface RequireRoleProps {
  rol: string
  children: React.ReactNode
}

/** Protege una ruta para que solo sea visible con un rol concreto. */
export default function RequireRole({ rol, children }: RequireRoleProps) {
  const usuario = useAuthStore((estado) => estado.user)

  if (usuario?.role !== rol) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
