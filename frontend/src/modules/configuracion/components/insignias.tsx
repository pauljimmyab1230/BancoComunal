import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui'

export function RolBadge({ rol }: { rol: string }) {
  if (rol === 'ADMIN') return <Badge variant="purple">Administrador</Badge>
  if (rol === 'TESORERO') return <Badge variant="blue">Tesorero</Badge>
  return <Badge variant="gray">Vocal</Badge>
}

export function EstadoBadge({ estado }: { estado: string }) {
  return estado === 'ACTIVO' ? (
    <Badge variant="green">Activo</Badge>
  ) : (
    <Badge variant="gray">Inactivo</Badge>
  )
}

export function TipoConceptoBadge({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'INGRESO':
      return <Badge variant="green">Ingreso</Badge>
    case 'EGRESO':
      return <Badge variant="red">Egreso</Badge>
    case 'TRANSFERENCIA':
      return <Badge variant="blue">Transferencia</Badge>
    case 'AJUSTE':
      return <Badge variant="yellow">Ajuste</Badge>
    default:
      return <Badge>{tipo}</Badge>
  }
}

export function AfectaSaldoTexto({ afectaSaldo }: { afectaSaldo: string }) {
  if (afectaSaldo === 'AUMENTA') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-4 w-4" aria-hidden="true" />
        Aumenta
      </span>
    )
  }
  if (afectaSaldo === 'DISMINUYE') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
        <TrendingDown className="h-4 w-4" aria-hidden="true" />
        Disminuye
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-subtle">
      <Minus className="h-4 w-4" aria-hidden="true" />
      No afecta
    </span>
  )
}
