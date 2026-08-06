import dotenv from 'dotenv'
dotenv.config()

function requiredSecret(name: string, fallback: string): string {
  const value = process.env[name]
  if (!value || value === fallback || value === 'fallback-secret' || value === 'fallback-refresh' || value === 'cambiar-este-secreto') {
    throw new Error(`Falta configurar ${name} en el archivo .env`)
  }
  return value
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: requiredSecret('JWT_SECRET', 'fallback-secret'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_REFRESH_SECRET: requiredSecret('JWT_REFRESH_SECRET', 'fallback-refresh'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
}
