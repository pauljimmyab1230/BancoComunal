import { z } from 'zod'

export const createPrestamoSchema = z.object({
  monto: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v > 0, 'El monto debe ser mayor a 0'),
  tasaInteres: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v >= 0, 'La tasa no puede ser negativa'),
  numeroCuotas: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v >= 1, 'Debe haber al menos 1 cuota'),
  fechaPrimerVencimiento: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
  fondoId: z.string().or(z.number()).transform((v) => Number(v)),
  socioId: z.string().or(z.number()).transform((v) => Number(v)),
})

export const pagoCuotaSchema = z.object({
  cuotaId: z.string().or(z.number()).transform((v) => Number(v)),
  monto: z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v > 0, 'El monto debe ser mayor a 0'),
  fechaPago: z.string().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']).default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
})
