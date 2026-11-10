import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

vi.mock('../../config/prisma', () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}))

vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '8h',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
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
import prisma from '../../config/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { HttpError } from '../../middleware/httpError'

const mockPrisma = vi.mocked(prisma)
const mockBcrypt = vi.mocked(bcrypt)
const mockJwt = vi.mocked(jwt)

const hashearToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

const mockUsuario = {
  id: 1,
  nombres: 'Juan',
  apellidoPaterno: 'Perez',
  apellidoMaterno: 'Lopez',
  username: 'juanperez',
  correo: 'juan@test.com',
  telefono: '999888777',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  password: '$2a$12$hashedpassword',
  intentosFallidos: 0,
  bloqueadoHasta: null,
  ultimoAcceso: null,
  cambiarPassword: false,
  createdAt: new Date('2026-01-01'),
}

describe('configuracionService.login', () => {
  it('should login successfully with valid credentials', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockBcrypt.compare.mockResolvedValue(true as never)
    mockPrisma.usuario.update.mockResolvedValue(mockUsuario as any)
    mockJwt.sign.mockReturnValue('mock-token' as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    const result = await configuracionService.login('juanperez', 'correctPassword')

    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({ where: { username: 'juanperez' } })
    expect(mockBcrypt.compare).toHaveBeenCalledWith('correctPassword', mockUsuario.password)
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { ultimoAcceso: expect.any(Date), intentosFallidos: 0, bloqueadoHasta: null },
    })
    expect(mockJwt.sign).toHaveBeenCalledTimes(2)
    expect(result).toHaveProperty('token')
    expect(result).toHaveProperty('refreshToken')
    expect(result.user).toEqual({
      id: 1,
      nombres: 'Juan',
      apellidoPaterno: 'Perez',
      username: 'juanperez',
      correo: 'juan@test.com',
      rol: 'ADMIN',
      cambiarPassword: false,
    })
  })

  it('should throw error for non-existent user', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null)

    await expect(configuracionService.login('unknown', 'pass')).rejects.toThrow(
      new HttpError(400, 'Usuario o contraseña incorrectos')
    )
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled()
  })

  it('should increment intentosFallidos on invalid password', async () => {
    const usuarioWithAttempts = { ...mockUsuario, intentosFallidos: 2 }
    mockPrisma.usuario.findUnique.mockResolvedValue(usuarioWithAttempts as any)
    mockBcrypt.compare.mockResolvedValue(false as never)
    mockPrisma.usuario.update.mockResolvedValue({} as any)

    await expect(configuracionService.login('juanperez', 'wrongPassword')).rejects.toThrow(
      new HttpError(400, 'Usuario o contraseña incorrectos')
    )
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { intentosFallidos: 3 },
    })
  })

  it('should lock account after 5 failed attempts', async () => {
    const usuarioWith4Attempts = { ...mockUsuario, intentosFallidos: 4 }
    mockPrisma.usuario.findUnique.mockResolvedValue(usuarioWith4Attempts as any)
    mockBcrypt.compare.mockResolvedValue(false as never)
    mockPrisma.usuario.update.mockResolvedValue({} as any)

    await expect(configuracionService.login('juanperez', 'wrongPassword')).rejects.toThrow(
      new HttpError(400, 'Usuario o contraseña incorrectos')
    )

    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        intentosFallidos: 5,
        bloqueadoHasta: expect.any(Date),
      },
    })
    const updateCall = mockPrisma.usuario.update.mock.calls[0][0] as any
    expect(updateCall.data.bloqueadoHasta.getTime()).toBe(Date.now() + 15 * 60 * 1000)
  })

  it('should reject login when account is locked', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000)
    const lockedUser = { ...mockUsuario, bloqueadoHasta: futureDate }
    mockPrisma.usuario.findUnique.mockResolvedValue(lockedUser as any)

    await expect(configuracionService.login('juanperez', 'password')).rejects.toThrow(
      expect.objectContaining({ status: 423 }) as any
    )
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('should allow login after lockout expires', async () => {
    const pastDate = new Date(Date.now() - 1 * 60 * 1000)
    const expiredLockUser = { ...mockUsuario, bloqueadoHasta: pastDate, intentosFallidos: 5 }
    mockPrisma.usuario.findUnique.mockResolvedValue(expiredLockUser as any)
    mockBcrypt.compare.mockResolvedValue(true as never)
    mockPrisma.usuario.update.mockResolvedValue({} as any)
    mockJwt.sign.mockReturnValue('mock-token' as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    const result = await configuracionService.login('juanperez', 'correctPassword')

    expect(result).toHaveProperty('token')
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { ultimoAcceso: expect.any(Date), intentosFallidos: 0, bloqueadoHasta: null },
    })
  })

  it('should reject login for inactive account', async () => {
    const inactiveUser = { ...mockUsuario, estado: 'INACTIVO' }
    mockPrisma.usuario.findUnique.mockResolvedValue(inactiveUser as any)
    mockBcrypt.compare.mockResolvedValue(true as never)

    await expect(configuracionService.login('juanperez', 'password')).rejects.toThrow(
      new HttpError(400, 'La cuenta está desactivada')
    )
    expect(mockPrisma.usuario.update).not.toHaveBeenCalled()
  })

  it('should reset intentosFallidos and bloqueadoHasta on successful login', async () => {
    const userWithFailedAttempts = {
      ...mockUsuario,
      intentosFallidos: 3,
      bloqueadoHasta: new Date(Date.now() - 1000),
    }
    mockPrisma.usuario.findUnique.mockResolvedValue(userWithFailedAttempts as any)
    mockBcrypt.compare.mockResolvedValue(true as never)
    mockPrisma.usuario.update.mockResolvedValue({} as any)
    mockJwt.sign.mockReturnValue('mock-token' as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    await configuracionService.login('juanperez', 'correctPassword')

    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { ultimoAcceso: expect.any(Date), intentosFallidos: 0, bloqueadoHasta: null },
    })
  })

  it('should store refresh token in database on successful login', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockBcrypt.compare.mockResolvedValue(true as never)
    mockPrisma.usuario.update.mockResolvedValue({} as any)
    mockJwt.sign
      .mockReturnValueOnce('access-token' as any)
      .mockReturnValueOnce('refresh-token' as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    await configuracionService.login('juanperez', 'correctPassword')

    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        token: hashearToken('refresh-token'),
        usuarioId: 1,
        expiresAt: expect.any(Date),
      },
    })
  })
})

describe('configuracionService.refreshToken', () => {
  const mockStoredToken = {
    id: 10,
    token: 'valid-refresh-token',
    usuarioId: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }

  it('should rotate refresh token successfully', async () => {
    mockJwt.verify.mockReturnValue({ userId: 1, type: 'refresh' } as any)
    mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken as any)
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockPrisma.refreshToken.delete.mockResolvedValue({} as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)
    mockJwt.sign.mockReturnValueOnce('new-access' as any).mockReturnValueOnce('new-refresh' as any)

    const result = await configuracionService.refreshToken('valid-refresh-token')

    expect(mockJwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret', {
      algorithms: ['HS256'],
    })
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 10 } })
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        token: hashearToken('new-refresh'),
        usuarioId: 1,
        expiresAt: expect.any(Date),
      },
    })
    expect(result).toMatchObject({ token: 'new-access', refreshToken: 'new-refresh' })
    expect(result.user).toMatchObject({ id: 1, username: 'juanperez', rol: 'ADMIN' })
  })

  it('should reject expired refresh token', async () => {
    const expiredToken = { ...mockStoredToken, expiresAt: new Date(Date.now() - 1000) }
    mockJwt.verify.mockReturnValue({ userId: 1, type: 'refresh' } as any)
    mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredToken as any)
    mockPrisma.refreshToken.delete.mockResolvedValue({} as any)

    await expect(configuracionService.refreshToken('expired-token')).rejects.toThrow(
      new HttpError(401, 'Token expirado')
    )
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 10 } })
  })

  it('should reject revoked refresh token', async () => {
    mockJwt.verify.mockReturnValue({ userId: 1, type: 'refresh' } as any)
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null)

    await expect(configuracionService.refreshToken('revoked-token')).rejects.toThrow(
      new HttpError(401, 'Token revocado o no válido')
    )
  })

  it('should reject non-refresh type token', async () => {
    mockJwt.verify.mockReturnValue({ userId: 1, type: 'access' } as any)

    await expect(configuracionService.refreshToken('wrong-type-token')).rejects.toThrow(
      new HttpError(401, 'Token inválido')
    )
  })

  it('should reject when user is not found', async () => {
    mockJwt.verify.mockReturnValue({ userId: 999, type: 'refresh' } as any)
    mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken as any)
    mockPrisma.usuario.findUnique.mockResolvedValue(null)

    await expect(configuracionService.refreshToken('valid-refresh-token')).rejects.toThrow(
      new HttpError(401, 'Usuario no encontrado')
    )
  })

  it('should reject when user account is inactive', async () => {
    const inactiveUser = { ...mockUsuario, estado: 'INACTIVO' }
    mockJwt.verify.mockReturnValue({ userId: 1, type: 'refresh' } as any)
    mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken as any)
    mockPrisma.usuario.findUnique.mockResolvedValue(inactiveUser as any)

    await expect(configuracionService.refreshToken('valid-refresh-token')).rejects.toThrow(
      new HttpError(401, 'Cuenta desactivada')
    )
  })

  it('should handle malformed JWT gracefully', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    await expect(configuracionService.refreshToken('malformed-token')).rejects.toThrow(
      new HttpError(401, 'Refresh token inválido o expirado')
    )
  })
})
