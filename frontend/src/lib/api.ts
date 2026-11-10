import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

type ConfigReintento = InternalAxiosRequestConfig & { _retry?: boolean }

let refrescando = false
let colaEspera: { resolve: () => void; reject: (error: unknown) => void }[] = []

function procesarCola(error: unknown) {
  colaEspera.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve()
  })
  colaEspera = []
}

async function cerrarSesionYRedirigir() {
  const { logout } = useAuthStore.getState()
  await logout()
  if (!sessionStorage.getItem('authRedirecting')) {
    sessionStorage.setItem('authRedirecting', '1')
    window.location.replace('/login')
  }
}

api.interceptors.response.use(
  (response) => {
    sessionStorage.removeItem('authRedirecting')
    return response
  },
  async (error) => {
    const originalRequest = error.config as ConfigReintento | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      // Ya hay un refresh en curso: esperar a que termine y reintentar.
      if (refrescando) {
        return new Promise<void>((resolve, reject) => {
          colaEspera.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      refrescando = true
      try {
        // Las cookies httpOnly viajan solas: no hace falta enviar el token en el body.
        await axios.post(`${API_URL}/configuracion/refresh-token`, {}, { withCredentials: true })
        procesarCola(null)
        return api(originalRequest)
      } catch (refreshError) {
        procesarCola(refreshError)
        await cerrarSesionYRedirigir()
        return Promise.reject(refreshError)
      } finally {
        refrescando = false
      }
    }

    const message = getErrorMessage(error)
    if (message) error.message = message
    return Promise.reject(error)
  }
)

export function extractServerMessage(error: unknown): string | null {
  const data = (
    error as AxiosError<{
      message?: string
      errors?: Array<{ mensaje?: string; message?: string }>
    }>
  )?.response?.data
  if (!data) return null
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const msgs = data.errors
      .map((e) => e?.mensaje || e?.message)
      .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
    if (msgs.length > 0) return msgs.join(' · ')
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  return null
}

function statusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Solicitud inválida'
    case 401:
      return 'Sesión no autorizada, inicia sesión nuevamente'
    case 403:
      return 'No tienes permisos para realizar esta acción'
    case 404:
      return 'El recurso solicitado no existe'
    case 409:
      return 'Conflicto con los datos existentes'
    case 422:
      return 'No se pudo procesar la solicitud'
    case 429:
      return 'Demasiadas solicitudes, intenta de nuevo más tarde'
    case 500:
      return 'Error interno del servidor'
    default:
      return `Error en el servidor (${status})`
  }
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  const serverMessage = extractServerMessage(error)
  if (serverMessage) return serverMessage
  if (axios.isAxiosError(error)) {
    if (error.response) return statusMessage(error.response.status)
    if (error.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor'
    if (error.code === 'ECONNABORTED') return 'La conexión con el servidor tardó demasiado'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback || 'Ocurrió un error inesperado'
}

export { api }
export default api

export async function openProtectedPdf(url: string): Promise<boolean> {
  // La autenticación viaja en la cookie httpOnly, no hace falta el header.
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  const ventana = window.open(objectUrl, '_blank')
  if (ventana === null) {
    URL.revokeObjectURL(objectUrl)
    return false
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  return true
}
