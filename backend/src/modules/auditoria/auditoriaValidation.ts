import { z } from 'zod'

export const auditLogSchema = z.object({
  tabla: z.string().min(1, 'La tabla es requerida'),
  registroId: z.number().int().positive('El ID del registro debe ser positivo'),
  operacion: z.enum(['CREATE', 'UPDATE', 'DELETE'], { message: 'Operación requerida' }),
  datosAnteriores: z.any().optional(),
  datosNuevos: z.any().optional(),
  usuarioId: z.number().int().positive('El ID del usuario es requerido'),
  ip: z.string().max(45).optional(),
})

export const auditLogQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tabla: z.string().optional(),
  operacion: z.string().optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>
