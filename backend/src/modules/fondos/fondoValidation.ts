import { z } from 'zod'

export const createFondoSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  organizacion: z.string().max(200).optional().or(z.literal('')),
  capitalInicial: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => !isNaN(v) && v >= 0, 'Capital inicial inválido'),
  capitalDisponible: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => !isNaN(v) && v >= 0, 'Capital disponible inválido').optional(),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CERRADO']).default('ACTIVO'),
  fechaCierre: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional().or(z.literal('')),
  reglamento: z.string().optional().or(z.literal('')),
  condiciones: z.string().optional().or(z.literal('')),
})

export const updateFondoSchema = createFondoSchema.omit({ capitalDisponible: true }).partial()

export const addSocioSchema = z.object({
  socioId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform((v) => parseInt(v, 10))]),
  numeroSocio: z.union([z.number().int(), z.string().regex(/^\d+$/).transform((v) => parseInt(v, 10))]).optional(),
  cargo: z.string().max(45).optional().or(z.literal('')),
  nivel: z.string().max(45).optional().or(z.literal('')),
  observacion: z.string().max(45).optional().or(z.literal('')),
  fechaIngreso: z.string().optional().or(z.literal('')),
  fechaAprobacion: z.string().optional().or(z.literal('')),
})
