/**
 * Convierte un valor a numero entero de forma segura.
 * Retorna undefined si el valor no es un numero entero valido.
 */
export function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.trunc(n)
}
