import { z } from 'zod'

export const createFondoSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  organizacion: z.string().max(200).optional().or(z.literal('')),
  capitalInicial: z.string().or(z.number()).transform((v) => Number(v)),
  capitalDisponible: z.string().or(z.number()).transform((v) => Number(v)).optional(),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CERRADO']).default('ACTIVO'),
  descripcion: z.string().optional().or(z.literal('')),
  reglamento: z.string().optional().or(z.literal('')),
  condiciones: z.string().optional().or(z.literal('')),
  responsableId: z.string().or(z.number()).transform((v) => Number(v)),
})

export const updateFondoSchema = createFondoSchema.partial()
