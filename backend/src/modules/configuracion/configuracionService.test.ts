import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, auditMock } = vi.hoisted(() => ({
  prismaMock: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn(),
    },
    configuracionOrganizacion: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    fondoRotatorio: {
      findFirst: vi.fn(),
    },
    conceptoCaja: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
  auditMock: vi.fn(),
}))

vi.mock('../../config/prisma', () => ({ default: prismaMock }))
vi.mock('../../config/auditLog', () => ({ createAuditLog: auditMock }))
vi.mock('../../config/env', () => ({
  env: {
    PORT: 3000,
    DATABASE_URL: 'mysql://test',
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '8h',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    UPLOAD_DIR: 'uploads',
    CORS_ORIGINS: 'http://localhost:5173',
  },
}))
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('$2a$12$hash'),
  },
}))
vi.mock('../caja/cajaService', () => ({
  cajaService: {
    getConceptoById: vi.fn(),
    createConcepto: vi.fn(),
    updateConcepto: vi.fn(),
    deleteConcepto: vi.fn(),
  },
}))

import { configuracionService } from './configuracionService'

const ADMIN_ACTIVO = {
  id: 1,
  username: 'admin',
  nombres: 'Admin',
  apellidoPaterno: 'Sistema',
  apellidoMaterno: null,
  rol: 'ADMIN',
  estado: 'ACTIVO',
}

const VOCAL = {
  id: 2,
  username: 'vocal',
  nombres: 'Vocal',
  apellidoPaterno: 'Prueba',
  apellidoMaterno: null,
  rol: 'VOCAL',
  estado: 'ACTIVO',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteUsuario', () => {
  it('impide que un usuario se desactive a sí mismo', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO)

    await expect(configuracionService.deleteUsuario(1, 1)).rejects.toThrow(
      'No puedes desactivar tu propia cuenta'
    )
    expect(prismaMock.usuario.update).not.toHaveBeenCalled()
  })

  it('impide desactivar al último administrador activo', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO)
    prismaMock.usuario.count.mockResolvedValue(0)

    await expect(configuracionService.deleteUsuario(1, 9)).rejects.toThrow(
      'Debe existir al menos un administrador activo'
    )
    expect(prismaMock.usuario.update).not.toHaveBeenCalled()
  })

  it('aplica baja lógica y revoca las sesiones', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(VOCAL)
    prismaMock.usuario.update.mockResolvedValue({ ...VOCAL, estado: 'INACTIVO' })

    const resultado = await configuracionService.deleteUsuario(2, 9, '127.0.0.1')

    expect(resultado).toBe(true)
    expect(prismaMock.usuario.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { estado: 'INACTIVO' },
    })
    expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 2 } })
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ operacion: 'DELETE', registroId: 2 })
    )
  })
})

describe('updateUsuario', () => {
  it('impide que un administrador se quite su propio rol', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO)

    await expect(configuracionService.updateUsuario(1, { rol: 'VOCAL' }, 1)).rejects.toThrow(
      'No puedes quitarte el rol de administrador'
    )
    expect(prismaMock.usuario.update).not.toHaveBeenCalled()
  })

  it('impide dejar el sistema sin administradores activos', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO)
    prismaMock.usuario.count.mockResolvedValue(0)

    await expect(configuracionService.updateUsuario(1, { estado: 'INACTIVO' }, 9)).rejects.toThrow(
      'Debe existir al menos un administrador activo'
    )
    expect(prismaMock.usuario.update).not.toHaveBeenCalled()
  })

  it('permite degradar a un administrador cuando existe otro activo', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(ADMIN_ACTIVO)
    prismaMock.usuario.count.mockResolvedValue(1)
    prismaMock.usuario.update.mockResolvedValue({ ...ADMIN_ACTIVO, rol: 'TESORERO' })

    const resultado = await configuracionService.updateUsuario(1, { rol: 'TESORERO' }, 9)

    expect(resultado?.rol).toBe('TESORERO')
    expect(prismaMock.usuario.update).toHaveBeenCalled()
  })
})

describe('organización', () => {
  it('guarda la configuración institucional sin tocar los fondos', async () => {
    const configuracion = {
      id: 1,
      organizacion: 'Banquito Solidario',
      ruc: null,
      direccion: null,
      telefono: null,
      email: null,
      monedaDefault: 'PEN',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    }
    prismaMock.configuracionOrganizacion.findUnique.mockResolvedValue(configuracion)
    prismaMock.configuracionOrganizacion.upsert.mockResolvedValue({
      ...configuracion,
      organizacion: 'Cooperativa Solidaria',
      ruc: '20123456789',
    })

    const resultado = await configuracionService.updateOrganizacion(
      {
        organizacion: 'Cooperativa Solidaria',
        ruc: '20123456789',
        direccion: '',
        telefono: '',
        email: '',
        monedaDefault: 'PEN',
      },
      7,
      '127.0.0.1'
    )

    expect(resultado.organizacion).toBe('Cooperativa Solidaria')
    expect(prismaMock.fondoRotatorio.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.configuracionOrganizacion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tabla: 'ConfiguracionOrganizacion',
        operacion: 'UPDATE',
        usuarioId: 7,
      })
    )
  })
})

describe('listConceptos', () => {
  it('incluye la cantidad de movimientos de cada concepto', async () => {
    prismaMock.conceptoCaja.findMany.mockResolvedValue([
      {
        id: 10,
        codigo: 'ING-01',
        nombre: 'Ingreso',
        tipo: 'INGRESO',
        afectaSaldo: 'AUMENTA',
        requiereComprobante: true,
        orden: 1,
        estado: 'ACTIVO',
        _count: { movimientos: 3 },
      },
    ])
    prismaMock.conceptoCaja.count.mockResolvedValue(1)

    const resultado = await configuracionService.listConceptos({})

    expect(resultado.data[0]).toMatchObject({ id: 10, movimientos: 3 })
    expect(resultado.data[0]).not.toHaveProperty('_count')
  })
})
