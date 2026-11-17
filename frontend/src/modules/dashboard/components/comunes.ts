import { Plus, Pencil, Trash2 } from 'lucide-react'

export const operacionIcon: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
}

export const operacionColor: Record<string, string> = {
  CREATE: 'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400',
  UPDATE: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  DELETE: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
}

export const operacionLabel: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
}

export const tablaLabel: Record<string, string> = {
  Socio: 'un socio',
  FondoRotatorio: 'un fondo',
  Aporte: 'un aporte',
  Prestamo: 'un préstamo',
  Caja: 'una caja',
  MovimientoCaja: 'un movimiento de caja',
  ConceptoCaja: 'un concepto',
  Usuario: 'un usuario',
  ArqueoCaja: 'un arqueo',
  CuotaPrestamo: 'una cuota',
}

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}
