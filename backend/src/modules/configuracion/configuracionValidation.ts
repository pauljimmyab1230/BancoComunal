import { z } from 'zod'

export const usuarioCreateSchema = z.object({
  nombres: z.string().min(1).max(100),
  apellidoPaterno: z.string().min(1).max(50),
  apellidoMaterno: z.string().min(1).max(50),
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(255),
  correo: z.string().email().max(150).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  rol: z.string().min(1).max(45),
  estado: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
})

export const usuarioUpdateSchema = usuarioCreateSchema.partial().omit({ password: true })

export const usuarioPasswordSchema = z.object({
  password: z.string().min(6).max(255),
})

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(255),
})

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const conceptoCajaCreateSchema = z.object({
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  afectaSaldo: z.enum(['AUMENTA', 'DISMINUYE', 'NO_AFECTA']),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  requiereComprobante: z.boolean().default(true),
  orden: z.number().int().default(0),
  estado: z.enum(['ACTIVO', 'INACTIVO']).default('ACTIVO'),
})

export const conceptoCajaUpdateSchema = conceptoCajaCreateSchema.partial()

export const organizacionUpdateSchema = z.object({
  organizacion: z.string().min(1).max(200),
  ruc: z.string().max(15).optional().or(z.literal('')),
  direccion: z.string().max(200).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().max(150).optional().or(z.literal('')),
  monedaDefault: z.enum(['PEN', 'USD']).default('PEN'),
})
