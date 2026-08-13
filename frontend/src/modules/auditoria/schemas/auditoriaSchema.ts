import { z } from 'zod'

export const auditoriaFilterSchema = z.object({
  tabla: z.string().optional(),
  operacion: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})

export type AuditoriaFilterValues = z.infer<typeof auditoriaFilterSchema>
