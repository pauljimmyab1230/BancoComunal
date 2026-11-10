import { z } from 'zod'

function validaMonto(v: number): boolean {
  return v > 0 && v <= 99999999.99 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6
}
const MSG_MONTO = 'El monto debe ser mayor a 0 y con hasta 2 decimales'

const tipoEnum = z.enum(['OBLIGATORIO', 'EXTRAORDINARIO', 'VOLUNTARIO', 'MULTA'])
const metodoPagoEnum = z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'])

export const createAporteSchema = z.object({
  tipo: tipoEnum,
  monto: z
    .string()
    .or(z.number())
    .transform((v) => Number(v))
    .refine(validaMonto, MSG_MONTO),
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato YYYY-MM válido requerido'),
  fechaAporte: z.string().optional(),
  metodoPago: metodoPagoEnum.default('EFECTIVO'),
  comprobante: z.string().max(100).optional().or(z.literal('')),
  observacion: z.string().optional().or(z.literal('')),
  fondoId: z
    .string()
    .or(z.number())
    .transform((v) => Number(v)),
  socioId: z
    .string()
    .or(z.number())
    .transform((v) => Number(v)),
})

export const updateAporteSchema = createAporteSchema
  .omit({ fondoId: true, socioId: true })
  .partial()
