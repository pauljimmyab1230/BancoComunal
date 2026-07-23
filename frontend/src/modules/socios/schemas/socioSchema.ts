import { z } from 'zod'

export const socioFormSchema = z.object({
  dni: z
    .string()
    .min(8, 'El DNI debe tener 8 dígitos')
    .max(8, 'El DNI debe tener 8 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  nombres: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'Solo se permiten letras'),
  apellidoPaterno: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'Solo se permiten letras'),
  apellidoMaterno: z
    .string()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'Solo se permiten letras'),
  genero: z.enum(['M', 'F']),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(
      (val) => {
        const date = new Date(val)
        const today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        const monthDiff = today.getMonth() - date.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--
        return age >= 18
      },
      { message: 'Debe ser mayor de 18 años' }
    ),
  estadoCivil: z.enum(['S', 'C', 'V', 'D']),
  telefono: z
    .string()
    .max(9, 'Máximo 9 dígitos')
    .regex(/^\d*$/, 'Solo se permiten números')
    .optional()
    .or(z.literal('')),
  direccion: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
  estado: z.enum(['A', 'I']),
})

export type SocioFormValues = z.infer<typeof socioFormSchema>
