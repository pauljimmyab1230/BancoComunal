import { z } from 'zod'

export const cajaCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(100),
  descripcion: z.string().max(500).optional(),
  tipo: z.enum(['PRINCIPAL', 'SECUNDARIA', 'CAJA_CHICA']).default('PRINCIPAL'),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  saldoInicial: z.number().min(0).default(0),
  fondoId: z.number().min(1, 'Fondo es requerido'),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'CERRADA']).default('ACTIVA'),
})

export const cajaUpdateSchema = cajaCreateSchema.partial()

export const movimientoCreateSchema = z.object({
  cajaId: z.number().min(1, 'Caja es requerida'),
  conceptoId: z.number().min(1, 'Concepto es requerido'),
  tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA', 'AJUSTE']),
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  descripcion: z.string().max(500).optional(),
  comprobante: z.string().max(100).optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO']).default('EFECTIVO'),
  referencia: z.string().max(100).optional(),
  fechaMovimiento: z.string().optional(),
})

export const arqueoCreateSchema = z.object({
  cajaId: z.number().min(1, 'Caja es requerida'),
  saldoFisico: z.number().min(0, 'Saldo físico es requerido'),
  fechaArqueo: z.string().optional(),
  observacion: z.string().max(500).optional(),
})

export const aprobarArqueoSchema = z.object({
  estado: z.enum(['APROBADO', 'RECHAZADO']),
  observacion: z.string().max(500).optional(),
})

export const transferirSchema = z.object({
  cajaDestinoId: z.number().min(1, 'Seleccione la caja destino'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  descripcion: z.string().max(500).optional(),
})

export const flujoProyectadoCreateSchema = z.object({
  cajaId: z.number().min(1, 'Caja es requerida'),
  fecha: z.string().min(1, 'Fecha es requerida'),
  tipo: z.enum(['INGRESO', 'EGRESO']),
  concepto: z.string().min(1, 'Concepto es requerido').max(100),
  montoProyectado: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  montoReal: z.number().optional(),
  descripcion: z.string().max(500).optional(),
})

export type CajaCreateInput = z.infer<typeof cajaCreateSchema>
export type MovimientoCreateInput = z.infer<typeof movimientoCreateSchema>
export type ArqueoCreateInput = z.infer<typeof arqueoCreateSchema>
export type AprobarArqueoInput = z.infer<typeof aprobarArqueoSchema>
export type TransferirInput = z.infer<typeof transferirSchema>
export type FlujoProyectadoCreateInput = z.infer<typeof flujoProyectadoCreateSchema>