import { z } from 'zod'

export const TABLAS_AUDITABLES = [
  'Socio',
  'Prestamo',
  'CuotaPrestamo',
  'Aporte',
  'FondoRotatorio',
  'FondoSocio',
  'Usuario',
] as const
export const OPERACIONES_AUDITABLES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'PAYMENT',
  'LIQUIDAR',
  'ANULAR',
] as const

export const auditLogSchema = z.object({
  tabla: z.enum(TABLAS_AUDITABLES, { message: 'Tabla no válida' }),
  registroId: z.number().int().positive('El ID del registro debe ser positivo'),
  operacion: z.enum(OPERACIONES_AUDITABLES, { message: 'Operación no válida' }),
  datosAnteriores: z.record(z.string(), z.unknown()).optional(),
  datosNuevos: z.record(z.string(), z.unknown()).optional(),
})

export const auditLogQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tabla: z.string().optional(),
  operacion: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>
