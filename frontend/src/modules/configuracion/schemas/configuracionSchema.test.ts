import { describe, expect, it } from 'vitest'
import {
  conceptoFormSchema,
  organizacionFormSchema,
  passwordFormSchema,
  passwordSchema,
  usuarioFormSchema,
} from './configuracionSchema'

const USUARIO_BASE = {
  nombres: 'Ana',
  apellidoPaterno: 'Pérez',
  apellidoMaterno: '',
  username: 'aperez',
  password: 'ClaveSegura#2026',
  correo: '',
  telefono: '',
  rol: 'VOCAL' as const,
  estado: 'ACTIVO' as const,
}

describe('política de contraseñas', () => {
  it('rechaza contraseñas de menos de 10 caracteres', () => {
    expect(passwordSchema.safeParse('Ab1#').success).toBe(false)
  })

  it('rechaza contraseñas sin símbolo', () => {
    expect(passwordSchema.safeParse('ClaveSegura2026').success).toBe(false)
  })

  it('rechaza contraseñas sin número', () => {
    expect(passwordSchema.safeParse('ClaveSegura#').success).toBe(false)
  })

  it('acepta una contraseña con longitud, letra, número y símbolo', () => {
    expect(passwordSchema.safeParse('ClaveSegura#2026').success).toBe(true)
  })

  it('exige que la confirmación coincida', () => {
    const resultado = passwordFormSchema.safeParse({
      password: 'ClaveSegura#2026',
      confirmacion: 'OtraClave#2026',
    })
    expect(resultado.success).toBe(false)
  })
})

describe('formulario de usuario', () => {
  it('permite omitir el apellido materno', () => {
    expect(usuarioFormSchema.safeParse(USUARIO_BASE).success).toBe(true)

    const sinCampo: Record<string, unknown> = { ...USUARIO_BASE }
    delete sinCampo.apellidoMaterno
    expect(usuarioFormSchema.safeParse(sinCampo).success).toBe(true)
  })

  it('rechaza un nombre de usuario con espacios', () => {
    const resultado = usuarioFormSchema.safeParse({ ...USUARIO_BASE, username: 'ana perez' })
    expect(resultado.success).toBe(false)
  })

  it('inicia con rol Vocal por defecto en los valores del formulario', async () => {
    const { VALORES_USUARIO_INICIALES } = await import('../components/comunes')
    expect(VALORES_USUARIO_INICIALES.rol).toBe('VOCAL')
  })
})

describe('formulario de organización', () => {
  const BASE = {
    organizacion: 'Banquito Solidario',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    monedaDefault: 'PEN' as const,
  }

  it('acepta RUC vacío y correo vacío', () => {
    expect(organizacionFormSchema.safeParse(BASE).success).toBe(true)
  })

  it('rechaza un RUC que no tenga 11 dígitos', () => {
    expect(organizacionFormSchema.safeParse({ ...BASE, ruc: '123' }).success).toBe(false)
  })

  it('acepta un RUC de 11 dígitos', () => {
    expect(organizacionFormSchema.safeParse({ ...BASE, ruc: '20123456789' }).success).toBe(true)
  })

  it('rechaza un correo institucional inválido', () => {
    expect(organizacionFormSchema.safeParse({ ...BASE, email: 'no-es-correo' }).success).toBe(false)
  })
})

describe('formulario de concepto', () => {
  it('rechaza un orden negativo', () => {
    const resultado = conceptoFormSchema.safeParse({
      codigo: 'ING-01',
      nombre: 'Ingreso',
      tipo: 'INGRESO',
      afectaSaldo: 'AUMENTA',
      descripcion: '',
      requiereComprobante: true,
      orden: -1,
      estado: 'ACTIVO',
    })
    expect(resultado.success).toBe(false)
  })
})
