import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'

vi.mock('../../config/env', () => ({
  env: {
    PORT: 3000,
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRES_IN: '8h',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    UPLOAD_DIR: 'uploads',
    CORS_ORIGINS: 'http://localhost:5173',
  },
}))

vi.mock('../../config/prisma', () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    fondoRotatorio: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    conceptoCaja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
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

vi.mock('../caja/movimientoHelper', () => ({
  generateCodigo: vi.fn().mockReturnValue('CAJ-TEST1234'),
}))

import request from 'supertest'
import { app } from '../../server'
import prisma from '../../config/prisma'
import bcrypt from 'bcryptjs'

const mockPrisma = vi.mocked(prisma)
const mockBcrypt = vi.mocked(bcrypt)

function generateRefreshToken(userId: number) {
  return jwt.sign({ userId, type: 'refresh' }, 'test-refresh-secret', { expiresIn: '7d' })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
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

describe('POST /api/configuracion/login', () => {
  it('should return tokens on successful login', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockBcrypt.compare.mockResolvedValue(true as never)
    mockPrisma.usuario.update.mockResolvedValue(mockUsuario as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    const res = await request(app)
      .post('/api/configuracion/login')
      .send({ username: 'juanperez', password: 'Correct1Pass' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('user')
    expect(res.body.data.user).toMatchObject({
      id: 1,
      username: 'juanperez',
      rol: 'ADMIN',
    })
    expect(res.headers['set-cookie']).toBeDefined()
    const cookies = res.headers['set-cookie'] as string[]
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true)
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true)
  })

  it('should return 400 on invalid credentials', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/configuracion/login')
      .send({ username: 'wronguser', password: 'wrongpass' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/incorrectos/)
  })

  it('should return 400 on wrong password', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockBcrypt.compare.mockResolvedValue(false as never)
    mockPrisma.usuario.update.mockResolvedValue(mockUsuario as any)

    const res = await request(app)
      .post('/api/configuracion/login')
      .send({ username: 'juanperez', password: 'WrongPass1' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return validation error on missing fields', async () => {
    const res = await request(app).post('/api/configuracion/login').send({ username: '' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 423 when account is locked', async () => {
    const lockedUser = {
      ...mockUsuario,
      bloqueadoHasta: new Date(Date.now() + 10 * 60 * 1000),
    }
    mockPrisma.usuario.findUnique.mockResolvedValue(lockedUser as any)

    const res = await request(app)
      .post('/api/configuracion/login')
      .send({ username: 'juanperez', password: 'Correct1Pass' })

    expect(res.status).toBe(423)
    expect(res.body.success).toBe(false)
  })
})

describe('POST /api/configuracion/refresh-token', () => {
  it('should rotate tokens with valid refresh token', async () => {
    const realRefreshToken = generateRefreshToken(1)
    const storedToken = {
      id: 10,
      token: realRefreshToken,
      usuarioId: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }

    mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken as any)
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockPrisma.refreshToken.delete.mockResolvedValue({} as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    const res = await request(app)
      .post('/api/configuracion/refresh-token')
      .send({ refreshToken: realRefreshToken })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('user')
    const cookiesRefresco = String(res.headers['set-cookie'] ?? '')
    expect(cookiesRefresco).toContain('accessToken=')
    expect(cookiesRefresco).toContain('refreshToken=')
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 10 } })
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled()
  })

  it('should return 400 when no refresh token provided', async () => {
    const res = await request(app).post('/api/configuracion/refresh-token').send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 401 on invalid refresh token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/configuracion/refresh-token')
      .send({ refreshToken: 'invalid-token' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should return 401 on expired refresh token', async () => {
    const expiredToken = jwt.sign({ userId: 1, type: 'refresh' }, 'test-refresh-secret', {
      expiresIn: '-1s',
    })
    const storedToken = {
      id: 10,
      token: expiredToken,
      usuarioId: 1,
      expiresAt: new Date(Date.now() - 1000),
    }
    mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken as any)
    mockPrisma.refreshToken.delete.mockResolvedValue({} as any)

    const res = await request(app)
      .post('/api/configuracion/refresh-token')
      .send({ refreshToken: expiredToken })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should accept refresh token from cookie', async () => {
    const realRefreshToken = generateRefreshToken(1)
    const storedToken = {
      id: 10,
      token: realRefreshToken,
      usuarioId: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }

    mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken as any)
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario as any)
    mockPrisma.refreshToken.delete.mockResolvedValue({} as any)
    mockPrisma.refreshToken.create.mockResolvedValue({} as any)

    const res = await request(app)
      .post('/api/configuracion/refresh-token')
      .set('Cookie', [`refreshToken=${realRefreshToken}`])

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('POST /api/configuracion/logout', () => {
  it('should clear cookies and return success', async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any)

    const res = await request(app)
      .post('/api/configuracion/logout')
      .set('Cookie', ['refreshToken=some-token'])

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toMatch(/cerrada/)
  })

  it('should return success even without refresh token cookie', async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 } as any)

    const res = await request(app).post('/api/configuracion/logout')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
