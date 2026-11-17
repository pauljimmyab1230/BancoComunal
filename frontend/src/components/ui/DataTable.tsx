import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T, index: number) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField?: string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionTo?: string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  keyField = 'id',
  loading = false,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No hay datos disponibles',
  emptyActionLabel,
  emptyActionTo,
  currentPage,
  totalPages,
  onPageChange,
  onSort,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-surface py-20">
        <LoadingSpinner text="Cargando datos..." />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionTo={emptyActionTo}
      />
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-muted/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sortKey !== col.key ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending'
                  }
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted ${
                    col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                  } ${col.className || ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                    >
                      {col.label}
                      {sortKey === col.key &&
                        (sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ))}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1">{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((item, index) => (
              <tr
                key={String(((item as Record<string, unknown>)[keyField] as string) ?? index)}
                className="transition-colors hover:bg-surface-muted/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-4 text-sm text-foreground ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(item, index)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentPage !== undefined && totalPages !== undefined && onPageChange && (
        <div className="border-t border-border-subtle px-5 py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
