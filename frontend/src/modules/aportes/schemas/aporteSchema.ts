import { z } from 'zod'

export const aporteFormSchema = z.object({
  tipo: z.enum(['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA'], {
    message: 'Seleccione un tipo de aporte',
  }),
  monto: z
    .number({ message: 'Debe ser un número' })
    .min(0.01, 'El monto debe ser mayor a 0'),
  periodo: z
    .string()
    .min(1, 'El período es requerido')
    .regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  fechaAporte: z.string().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'], {
    message: 'Seleccione un método de pago',
  }),
  comprobante: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  observacion: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  fondoId: z.number({ message: 'Seleccione un fondo' }).min(1, 'Seleccione un fondo'),
  socioId: z.number({ message: 'Seleccione un socio' }).min(1, 'Seleccione un socio'),
})

export type AporteFormValues = z.infer<typeof aporteFormSchema>
