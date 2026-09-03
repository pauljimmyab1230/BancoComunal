/**
 * Convierte un valor a número entero de forma segura.
 * Retorna undefined si el valor no es un número entero válido.
 */
export function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.trunc(n)
}

/**
 * Extrae y valida el ID de los parámetros de ruta.
 * Retorna undefined si el ID no es válido.
 */
export function parseRouteId(value: unknown): number | undefined {
  return toInt(value)
}

/**
 * Convierte un valor a número decimal de forma segura.
 * Retorna undefined si el valor no es un número válido.
 */
export function toDecimal(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
