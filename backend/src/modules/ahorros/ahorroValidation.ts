import { z } from 'zod'

export const createCuentaSchema = z.object({
  fondoId: z.string().or(z.number()).transform((v) => Number(v)),
  socioId: z.string().or(z.number()).transform((v) => Number(v)),
})

export const createMovimientoSchema = z.object({
  tipo: z.enum(['DEPOSITO', 'RETIRO']),
  monto: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v > 0, 'El monto debe ser mayor a 0'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']).default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
  observacion: z.string().optional().or(z.literal('')),
  cuentaId: z.string().or(z.number()).transform((v) => Number(v)),
})
