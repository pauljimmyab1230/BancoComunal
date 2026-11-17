import type { LucideIcon } from 'lucide-react'
import Card from './Card'

const TONOS = {
  indigo: 'bg-secondary/12 text-secondary',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  gray: 'bg-surface-muted text-muted',
} as const

export type TonoResumen = keyof typeof TONOS

interface ResumenCardProps {
  icono: LucideIcon
  etiqueta: string
  valor: number | undefined
  detalle: string
  tono?: TonoResumen
  cargando?: boolean
}

/** Tarjeta de conteo usada en las cabeceras de los módulos. */
export default function ResumenCard({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  tono = 'indigo',
  cargando = false,
}: ResumenCardProps) {
  return (
    <Card padding="md" hover={false}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONOS[tono]}`}
        >
          <Icono className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground">{cargando ? '—' : (valor ?? 0)}</p>
          <p className="text-xs text-muted">{etiqueta}</p>
          <p className="mt-0.5 text-xs text-subtle">{detalle}</p>
        </div>
      </div>
    </Card>
  )
}
