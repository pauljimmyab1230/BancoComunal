import { z } from 'zod'

export const usuarioFormSchema = z.object({
  nombres: z.string().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  apellidoPaterno: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  apellidoMaterno: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  username: z
    .string()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(255, 'Máximo 255 caracteres')
    .regex(/[a-zA-Z]/, 'Debe contener al menos una letra')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .optional()
    .or(z.literal('')),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  rol: z.enum(['ADMIN', 'TESORERO', 'VOCAL']),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
})

export const conceptoFormSchema = z.object({
  codigo: z.string().min(2, 'Debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres'),
  nombre: z.string().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  afectaSaldo: z.enum(['AUMENTA', 'DISMINUYE', 'NO_AFECTA']),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  requiereComprobante: z.boolean(),
  orden: z.number().int().min(0),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
})

export const organizacionFormSchema = z.object({
  organizacion: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  monedaDefault: z.enum(['PEN', 'USD']),
})

export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>
export type ConceptoFormValues = z.infer<typeof conceptoFormSchema>
export type OrganizacionFormValues = z.infer<typeof organizacionFormSchema>
