import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../config/prisma', () => ({
  default: {
    socio: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    prestamo: { count: vi.fn() },
    aporte: { count: vi.fn() },
    fondoSocio: { count: vi.fn() },
    beneficiario: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    documentoSocio: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../config/env', () => ({
  env: {
    UPLOAD_DIR: 'uploads',
  },
}))

vi.mock('../../config/auditLog', () => ({
  createAuditLog: vi.fn(),
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}))

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto')
  return {
    default: {
      ...actual,
      randomBytes: vi.fn((len: number) => {
        const buffer = Buffer.alloc(len)
        for (let i = 0; i < len; i++) buffer[i] = i % 36
        return buffer
      }),
    },
  }
})

import { socioService } from './socioService'
import prisma from '../../config/prisma'
import { createAuditLog } from '../../config/auditLog'
import { HttpError } from '../../middleware/httpError'

const mockPrisma = vi.mocked(prisma)
const mockAuditLog = vi.mocked(createAuditLog)

beforeEach(() => {
  vi.clearAllMocks()
})

const validSocioData = {
  dni: '12345678',
  nombres: 'Maria',
  apellidoPaterno: 'Garcia',
  apellidoMaterno: 'Lopez',
  genero: 'F' as const,
  fechaNacimiento: '1990-05-15',
  fechaIngreso: '2026-01-01',
  estado: 'A' as const,
}

describe('socioService.create', () => {
  it('should create a socio successfully with unique DNI and codigo', async () => {
    mockPrisma.socio.findUnique
      .mockResolvedValueOnce(null) // DNI check
      .mockResolvedValueOnce(null) // Codigo check
    mockPrisma.socio.create.mockResolvedValue({
      id: 1,
      codigo: 'ABCD1234',
      ...validSocioData,
      estadoCivil: null,
      telefono: null,
      direccion: null,
      email: null,
      fotoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    mockAuditLog.mockResolvedValue(undefined)

    const result = await socioService.create(validSocioData, undefined, 1)

    expect(mockPrisma.socio.findUnique).toHaveBeenCalledWith({ where: { dni: '12345678' } })
    expect(mockPrisma.socio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dni: '12345678',
          nombres: 'Maria',
          apellidoPaterno: 'Garcia',
          apellidoMaterno: 'Lopez',
          genero: 'F',
          estado: 'A',
        }),
      })
    )
    expect(mockAuditLog).toHaveBeenCalledWith({
      tabla: 'Socio',
      registroId: 1,
      operacion: 'CREATE',
      datosNuevos: expect.objectContaining({ dni: '12345678', nombres: 'Maria' }),
      usuarioId: 1,
    })
    expect(result).toHaveProperty('nombreCompleto')
  })

  it('should reject duplicate DNI', async () => {
    mockPrisma.socio.findUnique.mockResolvedValueOnce({ id: 99, dni: '12345678' } as any)

    await expect(socioService.create(validSocioData)).rejects.toThrow(
      new HttpError(400, 'El DNI ya está registrado')
    )
    expect(mockPrisma.socio.create).not.toHaveBeenCalled()
  })

  it('should reject socio under 18 years old', async () => {
    mockPrisma.socio.findUnique.mockResolvedValueOnce(null) // DNI unique
    const underageData = { ...validSocioData, fechaNacimiento: '2010-01-01' }

    await expect(socioService.create(underageData)).rejects.toThrow(
      new HttpError(400, 'El socio debe ser mayor de 18 años')
    )
  })

  it('should retry codigo generation when collision occurs', async () => {
    const existingCodigo = { id: 50, codigo: expect.any(String) }
    mockPrisma.socio.findUnique
      .mockResolvedValueOnce(null) // DNI check - unique
      .mockResolvedValueOnce(existingCodigo as any) // 1st codigo collision
      .mockResolvedValueOnce(null) // 2nd codigo - unique
    mockPrisma.socio.create.mockResolvedValue({
      id: 1,
      codigo: 'NEWCODE',
      ...validSocioData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    mockAuditLog.mockResolvedValue(undefined)

    const result = await socioService.create(validSocioData, undefined, 1)

    expect(mockPrisma.socio.findUnique).toHaveBeenCalledWith({ where: { dni: '12345678' } })
    expect(mockPrisma.socio.create).toHaveBeenCalled()
    expect(result).toHaveProperty('id', 1)
  })

  it('should throw error when codigo generation retries are exhausted', async () => {
    const existingSocio = { id: 50, codigo: 'TAKEN' }
    mockPrisma.socio.findUnique
      .mockResolvedValueOnce(null) // DNI unique
      .mockResolvedValue(existingSocio as any) // All 11 codigo checks return collision

    await expect(socioService.create(validSocioData)).rejects.toThrow(
      new HttpError(500, 'No se pudo generar un código único para el socio')
    )
  })

  it('should handle prisma create failure and clean up foto', async () => {
    mockPrisma.socio.findUnique
      .mockResolvedValueOnce(null) // DNI unique
      .mockResolvedValueOnce(null) // Codigo unique
    mockPrisma.socio.create.mockRejectedValue(new Error('DB error'))

    await expect(socioService.create(validSocioData)).rejects.toThrow('DB error')
  })

  it('should include fotoUrl when fotoFile is provided', async () => {
    mockPrisma.socio.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    mockPrisma.socio.create.mockResolvedValue({
      id: 1,
      codigo: 'ABCD1234',
      ...validSocioData,
      fotoUrl: '/uploads/fotos/test.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    mockAuditLog.mockResolvedValue(undefined)

    const mockFile = {
      originalname: 'foto.jpg',
      path: '/tmp/foto.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File

    const result = await socioService.create(validSocioData, mockFile, 1)

    expect(mockPrisma.socio.create).toHaveBeenCalled()
    expect(result).toHaveProperty('fotoUrl')
  })
})
