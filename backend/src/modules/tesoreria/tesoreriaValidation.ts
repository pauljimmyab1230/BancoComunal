import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  return val === '' || val === null || val === undefined ? undefined : val
}

export const tesoreriaDashboardSchema = z.object({
  cajaId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})

export const conciliacionBancariaSchema = z.object({
  cajaId: z.coerce.number().int().positive(),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
  saldoBanco: z.coerce.number(),
  movimientosBanco: z.array(z.object({
    fecha: z.string(),
    concepto: z.string(),
    monto: z.number(),
    referencia: z.string().optional(),
  })).optional(),
})

export const transferenciaEntreCajasSchema = z.object({
  cajaOrigenId: z.coerce.number().int().positive(),
  cajaDestinoId: z.coerce.number().int().positive(),
  monto: z.coerce.number().positive(),
  concepto: z.string().min(2).max(100),
  descripcion: z.string().max(500).optional(),
  comprobante: z.string().max(100).optional(),
})

export const reporteFlujoCajaSchema = z.object({
  cajaId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
  agruparPor: z.enum(['DIA', 'SEMANA', 'MES', 'CONCEPTO']).default('DIA'),
  tipo: z.enum(['TODOS', 'INGRESO', 'EGRESO']).default('TODOS'),
})

export const proyeccionFlujoSchema = z.object({
  cajaId: z.coerce.number().int().positive(),
  meses: z.coerce.number().int().min(1).max(12).default(3),
})