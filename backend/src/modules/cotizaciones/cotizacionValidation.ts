import { z } from 'zod'

const aNumero = (v: string | number) => Number(v)

export const createCotizacionSchema = z.object({
  monto: z
    .string()
    .or(z.number())
    .transform(aNumero)
    .refine((v) => !isNaN(v) && v > 0, 'El monto debe ser mayor a 0'),
  tasaInteres: z
    .string()
    .or(z.number())
    .transform(aNumero)
    .refine((v) => !isNaN(v) && v >= 0 && v <= 100, 'La tasa debe estar entre 0 y 100'),
  numeroCuotas: z
    .string()
    .or(z.number())
    .transform(aNumero)
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 60, 'Número de cuotas entre 1 y 60'),
  fechaPrimerVencimiento: z.string().min(1, 'La fecha de primer vencimiento es requerida'),
  fondoId: z.number().int().positive().optional().nullable(),
  socioId: z.number().int().positive().optional().nullable(),
  observacion: z.string().max(500).optional().or(z.literal('')),
})

export const updateCotizacionSchema = createCotizacionSchema.partial()

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA', 'BORRADOR']),
})
