import { AlertTriangle } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'

interface ErrorStateProps {
  title?: string
  description?: string
  error?: unknown
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = 'No se pudieron cargar los datos',
  description,
  error,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  const detalle =
    description ??
    (error !== undefined
      ? getErrorMessage(error)
      : 'Ocurrió un error al obtener la información. Verifica tu conexión e inténtalo de nuevo.')

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{detalle}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-secondary/25 transition-all hover:shadow-lg hover:shadow-secondary/30 active:scale-[0.98]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
