import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/ui'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const restaurarSesion = useAuthStore((s) => s.restaurarSesion)
  const location = useLocation()
  const [comprobado, setComprobado] = useState(false)

  useEffect(() => {
    let vivo = true
    restaurarSesion().finally(() => {
      if (vivo) setComprobado(true)
    })
    return () => {
      vivo = false
    }
  }, [restaurarSesion])

  if (!comprobado) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner text="Verificando sesión..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
