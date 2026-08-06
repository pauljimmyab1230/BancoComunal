import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  return val === '' || val === null || val === undefined ? undefined : val
}

function emptyToNull(val: unknown) {
  return val === '' ? null : val
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const createSocioSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos').regex(/^\d+$/),
  nombres: z.string().min(2).max(100),
  apellidoPaterno: z.string().min(2).max(50),
  apellidoMaterno: z.string().min(2).max(50),
  genero: z.enum(['M', 'F']),
  fechaNacimiento: z.preprocess(emptyToUndefined, z.string().regex(dateRegex, 'Fecha inválida (formato YYYY-MM-DD)').optional()),
  estadoCivil: z.preprocess(emptyToUndefined, z.enum(['S', 'C', 'V', 'D']).optional()),
  telefono: z.preprocess(emptyToUndefined, z.string().max(9).optional()),
  direccion: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional().or(z.literal(''))),
  fechaIngreso: z.string().regex(dateRegex, 'La fecha de ingreso es requerida y debe tener formato YYYY-MM-DD'),
  estado: z.enum(['A', 'I']).default('A'),
})

export const updateSocioSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos').regex(/^\d+$/).optional(),
  nombres: z.string().min(2).max(100).optional(),
  apellidoPaterno: z.string().min(2).max(50).optional(),
  apellidoMaterno: z.string().min(2).max(50).optional(),
  genero: z.enum(['M', 'F']).optional(),
  fechaNacimiento: z.preprocess(emptyToNull, z.string().regex(dateRegex, 'Fecha inválida (formato YYYY-MM-DD)').nullable().optional()),
  estadoCivil: z.preprocess(emptyToNull, z.enum(['S', 'C', 'V', 'D']).nullable().optional()),
  telefono: z.preprocess(emptyToNull, z.string().max(9).nullable().optional()),
  direccion: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().email().nullable().optional()),
  fechaIngreso: z.string().regex(dateRegex, 'Fecha inválida (formato YYYY-MM-DD)').optional(),
  estado: z.enum(['A', 'I']).optional(),
})

export const createBeneficiarioSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos').regex(/^\d+$/),
  nombres: z.string().min(2).max(100),
  apellidoPaterno: z.string().min(2).max(50),
  apellidoMaterno: z.string().min(2).max(50),
  fechaNacimiento: z.preprocess(emptyToUndefined, z.string().regex(dateRegex, 'Fecha inválida (formato YYYY-MM-DD)').optional()),
  parentesco: z.string().min(2).max(50),
  telefono: z.string().max(9).optional(),
})

export const tipoDocumentoEnum = z.enum([
  'DNI', 'CEDULA', 'PASAPORTE', 'PARTIDA_NAC', 'CERTIFICADO', 'CONTRATO', 'OTRO',
])
