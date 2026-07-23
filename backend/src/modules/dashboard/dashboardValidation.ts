import { z } from 'zod'

export const dashboardQuerySchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
})
