import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {actionLabel && (onAction || actionTo) && (
        <div className="mt-6">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/25 transition-all hover:shadow-lg hover:shadow-[#2563EB]/30 active:scale-[0.98]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/25 transition-all hover:shadow-lg hover:shadow-[#2563EB]/30 active:scale-[0.98]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
