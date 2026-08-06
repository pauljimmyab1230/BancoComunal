import { z } from 'zod'

export const estadoCuentasSocioSchema = z.object({
  socioId: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  fondoId: z.coerce.number().int().positive().optional(),
}).refine((d) => d.socioId !== undefined || (d.search !== undefined && d.search.length > 0), {
  message: 'Debe enviar socioId o search (DNI/código)',
})

export const carteraCreditosSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['ACTIVO', 'PAGADO', 'ANULADO', 'TODOS']).default('TODOS'),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  limit: z.coerce.number().int().positive().max(5000).default(1000),
})

export const estadoResultadosSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
})

export const reporteAportesSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  periodo: z.string().optional(),
  tipo: z.enum(['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA', 'TODOS']).default('TODOS'),
  limit: z.coerce.number().int().positive().max(5000).default(1000),
})

export const morososSchema = z.object({
  fondoId: z.coerce.number().int().positive().optional(),
  diasMinimos: z.coerce.number().int().min(1).default(1),
})

export const resumenEjecutivoSchema = z.object({})
