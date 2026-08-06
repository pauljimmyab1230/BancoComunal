import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  return val === '' || val === null || val === undefined ? undefined : val
}

export const createCajaSchema = z.object({
  codigo: z.string().min(3).max(20).optional(),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(500).optional(),
  tipo: z.enum(['PRINCIPAL', 'SECUNDARIA', 'CAJA_CHICA']).default('PRINCIPAL'),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  saldoInicial: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional().default(0)),
  fondoId: z.coerce.number().int().positive(),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'CERRADA']).default('ACTIVA'),
})

export const updateCajaSchema = createCajaSchema.partial()

export const createConceptoCajaSchema = z.object({
  codigo: z.string().min(3).max(20).optional(),
  nombre: z.string().min(2).max(100),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  afectaSaldo: z.enum(['AUMENTA', 'DISMINUYE', 'NO_AFECTA']),
  descripcion: z.string().max(500).optional(),
  requiereComprobante: z.boolean().default(true),
  orden: z.coerce.number().int().min(0).default(0),
})

export const updateConceptoCajaSchema = createConceptoCajaSchema.partial()

export const createMovimientoSchema = z.object({
  cajaId: z.coerce.number().int().positive(),
  conceptoId: z.coerce.number().int().positive(),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  monto: z.coerce.number().positive(),
  descripcion: z.string().max(500).optional(),
  comprobante: z.string().max(100).optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO']).default('EFECTIVO'),
  referencia: z.string().max(100).optional(),
  fechaMovimiento: z.string().optional(),
})

export const createArqueoSchema = z.object({
  cajaId: z.coerce.number().int().positive(),
  saldoFisico: z.coerce.number().min(0, 'El saldo físico no puede ser negativo'),
  fechaArqueo: z.string().optional(),
  observacion: z.string().max(500).optional(),
})

export const aprobarArqueoSchema = z.object({
  estado: z.enum(['APROBADO', 'RECHAZADO']),
  observacion: z.string().max(500).optional(),
})

export const transferirSchema = z.object({
  cajaOrigenId: z.coerce.number().int().positive(),
  cajaDestinoId: z.coerce.number().int().positive(),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().max(500).optional(),
})

export const createFlujoProyectadoSchema = z.object({
  cajaId: z.coerce.number().int().positive(),
  fecha: z.string().min(1, 'Fecha requerida'),
  tipo: z.enum(['INGRESO', 'EGRESO']),
  concepto: z.string().min(2).max(100),
  montoProyectado: z.coerce.number().positive(),
  montoReal: z.coerce.number().optional(),
  descripcion: z.string().max(500).optional(),
})

export const updateFlujoProyectadoSchema = createFlujoProyectadoSchema.partial()

export const queryCajaSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  estado: z.string().optional(),
  tipo: z.string().optional(),
  fondoId: z.coerce.number().int().positive().optional(),
})

export const queryArqueoSchema = z.object({
  cajaId: z.coerce.number().int().positive().optional(),
  estado: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const queryFlujoSchema = z.object({
  cajaId: z.coerce.number().int().positive().optional(),
  estado: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
})