import { z } from 'zod'

export const prestamoFormSchema = z.object({
  monto: z
    .number({ message: 'Debe ser un número' })
    .min(1, 'El monto debe ser mayor a 0'),
  tasaInteres: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100%'),
  numeroCuotas: z
    .number({ message: 'Debe ser un número entero' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 cuota'),
  fechaPrimerVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  fondoId: z.number().optional(),
  socioId: z.number().optional(),
})

export const pagoCuotaSchema = z.object({
  cuotaId: z.number(),
  monto: z
    .number({ message: 'Debe ser un número' })
    .min(0.01, 'El monto debe ser mayor a 0'),
  fechaPago: z.string().optional(),
  metodoPago: z.string().min(1, 'El método de pago es requerido'),
  comprobante: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
})

export type PrestamoFormValues = z.infer<typeof prestamoFormSchema>
export type PagoCuotaFormValues = z.infer<typeof pagoCuotaSchema>
