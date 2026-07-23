import { z } from 'zod'

export const estadoCuentasSocioSchema = z.object({
  socioId: z.coerce.number().int().positive(),
  fondoId: z.coerce.number().int().positive().optional(),
})

export const carteraCreditosSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['ACTIVO', 'PAGADO', 'ANULADO', 'PENDIENTE', 'TODOS']).default('TODOS'),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})

export const estadoResultadosSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
})

export const reporteAportesSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  periodo: z.string().optional(),
  tipo: z.enum(['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'TODOS']).default('TODOS'),
})

export const morososSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  diasMinimos: z.coerce.number().int().min(1).default(1),
})

export const resumenEjecutivoSchema = z.object({})
