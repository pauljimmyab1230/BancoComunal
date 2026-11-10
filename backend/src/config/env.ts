import dotenv from 'dotenv'
dotenv.config()

const LONGITUD_MINIMA_SECRETO = 32
const NOMBRE_PROYECTO = 'banquito'

function validarSecreto(nombre: string): string {
  const valor = process.env[nombre]
  if (!valor) {
    throw new Error(`Falta configurar ${nombre} en el archivo .env`)
  }
  if (valor.length < LONGITUD_MINIMA_SECRETO) {
    throw new Error(
      `${nombre} debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres (tiene ${valor.length}). ` +
        `Genere uno con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    )
  }
  if (valor.toLowerCase().includes(NOMBRE_PROYECTO)) {
    throw new Error(`${nombre} no debe contener el nombre del proyecto "${NOMBRE_PROYECTO}"`)
  }
  return valor
}

function parsearTrustProxy(valor?: string): boolean | number | string | undefined {
  if (!valor) return undefined
  if (valor === 'true') return true
  if (valor === 'false') return false
  if (/^\d+$/.test(valor)) return Number(valor)
  return valor
}

const JWT_SECRET = validarSecreto('JWT_SECRET')
const JWT_REFRESH_SECRET = validarSecreto('JWT_REFRESH_SECRET')

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET y JWT_REFRESH_SECRET deben ser secretos distintos entre sí')
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_REFRESH_SECRET,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174',
  TRUST_PROXY: parsearTrustProxy(process.env.TRUST_PROXY),
}
