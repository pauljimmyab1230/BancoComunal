import { z } from 'zod'

const tipoEnum = z.enum(['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA'])
const metodoPagoEnum = z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'])

export const createAporteSchema = z.object({
  tipo: tipoEnum,
  monto: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v > 0, 'El monto debe ser mayor a 0'),
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato YYYY-MM válido requerido'),
  fechaAporte: z.string().optional(),
  metodoPago: metodoPagoEnum.default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
  observacion: z.string().optional().or(z.literal('')),
  fondoId: z.string().or(z.number()).transform((v) => Number(v)),
  socioId: z.string().or(z.number()).transform((v) => Number(v)),
})

export const updateAporteSchema = createAporteSchema
  .omit({ fondoId: true, socioId: true })
  .partial()
