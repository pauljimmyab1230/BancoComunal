import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      sessionStorage.removeItem('authRedirecting')
    }
    return config
  },
  (error) => Promise.reject(error)
)

export function extractServerMessage(error: unknown): string | null {
  const data = (error as any)?.response?.data
  if (!data) return null
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const msgs = data.errors
      .map((e: any) => e?.mensaje || e?.message)
      .filter((m: unknown): m is string => typeof m === 'string' && m.trim().length > 0)
    if (msgs.length > 0) return msgs.join(' · ')
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  return null
}

function statusMessage(status: number): string {
  switch (status) {
    case 400: return 'Solicitud inválida'
    case 401: return 'Sesión no autorizada, inicia sesión nuevamente'
    case 403: return 'No tienes permisos para realizar esta acción'
    case 404: return 'El recurso solicitado no existe'
    case 409: return 'Conflicto con los datos existentes'
    case 422: return 'No se pudo procesar la solicitud'
    case 429: return 'Demasiadas solicitudes, intenta de nuevo más tarde'
    case 500: return 'Error interno del servidor'
    default: return `Error en el servidor (${status})`
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('token')
      localStorage.removeItem('token')
      // Evitar bucle de recargas: solo redirigir si había sesión (expiró/inválida)
      // y solo una vez por carga. Sin token no redirigimos para no recargar en loop.
      if (hadToken && !sessionStorage.getItem('authRedirecting')) {
        sessionStorage.setItem('authRedirecting', '1')
        window.location.replace('/login')
      }
    }
    const message = getErrorMessage(error)
    if (message) error.message = message
    return Promise.reject(error)
  }
)

export { api }
export default api

/**
 * Descarga un PDF protegido por autenticación (con el token Bearer) y lo
 * abre en una pestaña nueva. Devuelve true si el PDF se abrió correctamente.
 */
export async function openProtectedPdf(url: string): Promise<boolean> {
  const token = localStorage.getItem('token')
  const response = await api.get(url, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank')
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  return true
}
