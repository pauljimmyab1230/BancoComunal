import { z } from 'zod'

/**
 * Política de contraseñas compartida por el alta de usuario y el cambio de contraseña:
 * mínimo 10 caracteres, al menos una letra, un número y un símbolo.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Debe tener al menos 10 caracteres')
  .max(255, 'Máximo 255 caracteres')
  .regex(/[a-zA-Z]/, 'Debe contener al menos una letra')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un símbolo')

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
  password: passwordSchema.optional().or(z.literal('')),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  rol: z.enum(['ADMIN', 'TESORERO', 'VOCAL']),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
})

export const passwordFormSchema = z
  .object({
    password: passwordSchema,
    confirmacion: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((valores) => valores.password === valores.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })

export const conceptoFormSchema = z.object({
  codigo: z.string().min(2, 'Debe tener al menos 2 caracteres').max(20, 'Máximo 20 caracteres'),
  nombre: z.string().min(2, 'Debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres'),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  afectaSaldo: z.enum(['AUMENTA', 'DISMINUYE', 'NO_AFECTA']),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  requiereComprobante: z.boolean(),
  orden: z.number().int('Debe ser un número entero').min(0, 'No puede ser negativo'),
  estado: z.enum(['ACTIVO', 'INACTIVO']),
})

export const organizacionFormSchema = z.object({
  organizacion: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  ruc: z
    .string()
    .regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos')
    .optional()
    .or(z.literal('')),
  direccion: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  telefono: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  monedaDefault: z.enum(['PEN', 'USD']),
})

export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>
export type PasswordFormValues = z.infer<typeof passwordFormSchema>
export type ConceptoFormValues = z.infer<typeof conceptoFormSchema>
export type OrganizacionFormValues = z.infer<typeof organizacionFormSchema>
