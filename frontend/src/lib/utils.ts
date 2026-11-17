import { clsx, type ClassValue } from 'clsx'
import * as XLSX from 'xlsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function formatDate(dateString: string, locale = 'es-ES'): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatShortDate(dateString: string, locale = 'es-ES'): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Iniciales de un socio: primera letra del nombre + primera letra del apellido paterno. */
export function getSocioIniciales(nombres: string, apellidoPaterno: string): string {
  return `${nombres.charAt(0) ?? ''}${apellidoPaterno.charAt(0) ?? ''}`.toUpperCase()
}

const CLASES_AVATAR = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
]

/** Color de avatar determinista a partir de una cadena (por ej. el código del socio). */
export function getClaseAvatar(seed: string): string {
  const indice = (seed.charCodeAt(0) || 0) % CLASES_AVATAR.length
  return CLASES_AVATAR[indice] ?? 'bg-surface-hover text-muted'
}

export function formatCurrency(amount: number, currency = 'PEN', locale = 'es-PE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatSaldosPorMoneda(saldos?: Record<string, number>): string {
  if (!saldos || Object.keys(saldos).length === 0) return formatCurrency(0)
  return Object.entries(saldos)
    .map(([moneda, monto]) => formatCurrency(monto, moneda))
    .join(' · ')
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportXlsx(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const datos: (string | number)[][] = [
    headers,
    ...rows.map((fila) =>
      fila.map((celda) => (celda === null || celda === undefined ? '' : celda))
    ),
  ]
  const hoja = XLSX.utils.aoa_to_sheet(datos)
  hoja['!cols'] = headers.map(() => ({ wch: 22 }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos')
  const nombre = /\.xlsx$/i.test(filename) ? filename : `${filename}.xlsx`
  XLSX.writeFile(libro, nombre)
}
