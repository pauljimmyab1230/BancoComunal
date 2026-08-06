import { z } from 'zod'

const montoSchema = z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v > 0, 'El monto debe ser mayor a 0')
const tasaSchema = z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v >= 0, 'La tasa no puede ser negativa').refine((v) => v <= 100, 'La tasa no puede superar 100%')
const numeroCuotasSchema = z.string().or(z.number()).transform((v) => Number(v)).refine((v) => v >= 1, 'Debe haber al menos 1 cuota').refine((v) => v <= 60, 'El número de cuotas no puede superar 60')
const fechaSchema = z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida')
const idSchema = z.string().or(z.number()).transform((v) => Number(v))

export const createPrestamoSchema = z.object({
  monto: montoSchema,
  tasaInteres: tasaSchema,
  numeroCuotas: numeroCuotasSchema,
  fechaPrimerVencimiento: fechaSchema,
  fondoId: idSchema,
  socioId: idSchema,
})

export const updatePrestamoSchema = z.object({
  monto: montoSchema.optional(),
  tasaInteres: tasaSchema.optional(),
  numeroCuotas: numeroCuotasSchema.optional(),
  fechaPrimerVencimiento: fechaSchema.optional(),
})

export const pagoCuotaSchema = z.object({
  cuotaId: idSchema,
  monto: montoSchema,
  fechaPago: z.string().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']).default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
})

export const liquidarSchema = z.object({
  prestamoId: idSchema,
  fechaPago: z.string().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']).default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
})
