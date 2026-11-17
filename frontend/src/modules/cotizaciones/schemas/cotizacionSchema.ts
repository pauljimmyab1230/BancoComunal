import { z } from 'zod'

export const cotizacionFormSchema = z.object({
  monto: z
    .string()
    .min(1, 'Ingrese un monto')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'El monto debe ser mayor a 0'),
  tasaInteres: z
    .string()
    .min(1, 'Ingrese una tasa')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, 'Tasa entre 0 y 100'),
  numeroCuotas: z
    .string()
    .min(1, 'Ingrese el número de cuotas')
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 60,
      'Entre 1 y 60 cuotas'
    ),
  fechaPrimerVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  fondoId: z.string().optional().or(z.literal('')),
  socioId: z.string().optional().or(z.literal('')),
  observacion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
})

export type CotizacionFormValues = z.infer<typeof cotizacionFormSchema>
