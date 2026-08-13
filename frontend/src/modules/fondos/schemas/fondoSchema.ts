import { z } from 'zod'

export const fondoFormSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  organizacion: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  capitalInicial: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'No puede ser negativo'),
  moneda: z.enum(['PEN', 'USD']),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CERRADO']),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  reglamento: z.string().optional().or(z.literal('')),
  condiciones: z.string().optional().or(z.literal('')),
})

export type FondoFormValues = z.infer<typeof fondoFormSchema>
