import type { ConceptoFormValues, UsuarioFormValues } from '../schemas/configuracionSchema'

export const OPCIONES_ROL = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'TESORERO', label: 'Tesorero' },
  { value: 'VOCAL', label: 'Vocal' },
]

export const OPCIONES_ROL_FILTRO = [{ value: '', label: 'Todos los roles' }, ...OPCIONES_ROL]

export const OPCIONES_TIPO = [
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'AJUSTE', label: 'Ajuste' },
]

export const OPCIONES_TIPO_FILTRO = [{ value: '', label: 'Todos los tipos' }, ...OPCIONES_TIPO]

export const OPCIONES_AFECTA_SALDO = [
  { value: 'AUMENTA', label: 'Aumenta' },
  { value: 'DISMINUYE', label: 'Disminuye' },
  { value: 'NO_AFECTA', label: 'No afecta' },
]

export const OPCIONES_MONEDA = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

const ETIQUETAS_ROL: Record<string, string> = {
  ADMIN: 'Administrador',
  TESORERO: 'Tesorero',
  VOCAL: 'Vocal',
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
}

const ETIQUETAS_TIPO: Record<string, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  TRANSFERENCIA: 'Transferencia',
  AJUSTE: 'Ajuste',
}

const ETIQUETAS_AFECTA_SALDO: Record<string, string> = {
  AUMENTA: 'Aumenta',
  DISMINUYE: 'Disminuye',
  NO_AFECTA: 'No afecta',
}

export function etiquetaRol(valor: string): string {
  return ETIQUETAS_ROL[valor] ?? valor
}

export function etiquetaEstado(valor: string): string {
  return ETIQUETAS_ESTADO[valor] ?? valor
}

export function etiquetaTipo(valor: string): string {
  return ETIQUETAS_TIPO[valor] ?? valor
}

export function etiquetaAfectaSaldo(valor: string): string {
  return ETIQUETAS_AFECTA_SALDO[valor] ?? valor
}

export function calcularFuerza(valor: string) {
  let puntos = 0
  if (valor.length >= 10) puntos += 1
  if (valor.length >= 14) puntos += 1
  if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) puntos += 1
  if (/\d/.test(valor)) puntos += 1
  if (/[^a-zA-Z0-9]/.test(valor)) puntos += 1

  const nivel = Math.min(puntos, 4)
  const niveles = [
    { etiqueta: 'Muy débil', barra: 'bg-red-500', texto: 'text-red-600 dark:text-red-400' },
    { etiqueta: 'Débil', barra: 'bg-orange-500', texto: 'text-orange-600 dark:text-orange-400' },
    { etiqueta: 'Aceptable', barra: 'bg-amber-500', texto: 'text-amber-600 dark:text-amber-400' },
    {
      etiqueta: 'Buena',
      barra: 'bg-emerald-500',
      texto: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      etiqueta: 'Fuerte',
      barra: 'bg-emerald-500',
      texto: 'text-emerald-600 dark:text-emerald-400',
    },
  ] as const

  return { nivel, ...(niveles[nivel] ?? niveles[0]) }
}

export const VALORES_USUARIO_INICIALES: UsuarioFormValues = {
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  username: '',
  password: '',
  correo: '',
  telefono: '',
  rol: 'VOCAL',
  estado: 'ACTIVO',
}

export const VALORES_CONCEPTO_INICIALES: ConceptoFormValues = {
  codigo: '',
  nombre: '',
  tipo: 'INGRESO',
  afectaSaldo: 'AUMENTA',
  descripcion: '',
  requiereComprobante: false,
  orden: 0,
  estado: 'ACTIVO',
}
