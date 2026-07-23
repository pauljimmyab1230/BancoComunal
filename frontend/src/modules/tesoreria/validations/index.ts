import { z } from 'zod'

export const flujoCajaParamsSchema = z.object({
  cajaId: z.number().int().positive().optional(),
  fechaInicio: z.string().min(1, 'Fecha inicio es requerida'),
  fechaFin: z.string().min(1, 'Fecha fin es requerida'),
  agruparPor: z.enum(['DIA', 'SEMANA', 'MES', 'CONCEPTO']).default('DIA'),
  tipo: z.enum(['TODOS', 'INGRESO', 'EGRESO']).default('TODOS'),
})

export type FlujoCajaFormInput = z.infer<typeof flujoCajaParamsSchema>
