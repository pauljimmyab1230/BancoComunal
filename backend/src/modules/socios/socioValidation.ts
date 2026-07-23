import { z } from 'zod'

function emptyToUndefined(val: unknown) {
  return val === '' || val === null || val === undefined ? undefined : val
}

export const createSocioSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos').regex(/^\d+$/),
  nombres: z.string().min(2).max(100),
  apellidoPaterno: z.string().min(2).max(50),
  apellidoMaterno: z.string().min(2).max(50),
  genero: z.enum(['M', 'F']),
  fechaNacimiento: z.preprocess(emptyToUndefined, z.string().optional()),
  estadoCivil: z.preprocess(emptyToUndefined, z.enum(['S', 'C', 'V', 'D']).optional()),
  telefono: z.preprocess(emptyToUndefined, z.string().max(9).optional()),
  direccion: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional().or(z.literal(''))),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
  estado: z.enum(['A', 'I']).default('A'),
})

export const updateSocioSchema = createSocioSchema.partial()

export const createBeneficiarioSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos').regex(/^\d+$/),
  nombres: z.string().min(2).max(100),
  apellidoPaterno: z.string().min(2).max(50),
  apellidoMaterno: z.string().min(2).max(50),
  fechaNacimiento: z.string().optional(),
  parentesco: z.string().min(2).max(50),
  telefono: z.string().max(9).optional(),
})

export const tipoDocumentoEnum = z.enum([
  'DNI', 'CEDULA', 'PASAPORTE', 'PARTIDA_NAC', 'CERTIFICADO', 'CONTRATO', 'OTRO',
])
