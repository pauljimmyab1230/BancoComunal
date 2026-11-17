import { z } from 'zod'

export const prestamoFormSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
    if (!data.fondoId) {
      ctx.addIssue({ code: 'custom', path: ['fondoId'], message: 'Seleccione un fondo' })
    }
    if (!data.socioId) {
      ctx.addIssue({ code: 'custom', path: ['socioId'], message: 'Seleccione un socio' })
    }
  })

export const pagoCuotaSchema = z.object({
  cuotaId: z.number(),
  monto: z.number({ message: 'Debe ser un número' }).min(0.01, 'El monto debe ser mayor a 0'),
  fechaPago: z.string().optional(),
  metodoPago: z.string().min(1, 'El método de pago es requerido'),
  comprobante: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
})

export type PrestamoFormValues = z.infer<typeof prestamoFormSchema>
export type PagoCuotaFormValues = z.infer<typeof pagoCuotaSchema>
