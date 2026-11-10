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
    caja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    conceptoCaja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    movimientoCaja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    arqueoCaja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    fondoRotatorio: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    flujoCajaProyectado: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
    usuario: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('./movimientoHelper', () => ({
  generateCodigo: vi.fn().mockReturnValue('MOV-TEST1234'),
}))

vi.mock('./cajaService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cajaService')>()
  return {
    cajaService: {
      ...actual.cajaService,
      crearConceptosPorDefecto: vi.fn(),
    },
  }
})

vi.mock('../../config/seed', () => ({
  seedDatabase: vi.fn(),
}))

vi.mock('../../modules/creditos/creditoService', () => ({
  marcarCuotasVencidas: vi.fn(),
}))

import request from 'supertest'
import { app } from '../../server'
import prisma from '../../config/prisma'
import { cajaService } from './cajaService'

const mockPrisma = vi.mocked(prisma)

function generateAuthToken(payload: { userId: number; username: string; rol: string }) {
  return jwt.sign(payload, 'test-jwt-secret', { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

const adminToken = generateAuthToken({ userId: 1, username: 'admin', rol: 'ADMIN' })

const mockFondo = {
  id: 1,
  nombre: 'Fondo Principal',
  moneda: 'PEN',
  estado: 'ACTIVO',
  organizacion: 'Banquito Solidario',
}

const mockCaja = {
  id: 1,
  codigo: 'CAJ-001',
  nombre: 'Caja Principal',
  descripcion: 'Caja principal',
  tipo: 'PRINCIPAL',
  moneda: 'PEN',
  saldoInicial: 1000,
  saldoActual: 5000,
  fondoId: 1,
  estado: 'ACTIVA',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockCajaWithRelations = {
  ...mockCaja,
  fondo: { id: 1, nombre: 'Fondo Principal', moneda: 'PEN' },
  _count: { movimientos: 5, arqueos: 2 },
}

const mockConceptoIngreso = {
  id: 1,
  codigo: 'ING-APORTE',
  nombre: 'Aporte de Socio',
  tipo: 'INGRESO',
  afectaSaldo: 'AUMENTA',
  requiereComprobante: true,
  estado: 'ACTIVO',
  orden: 1,
  descripcion: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockConceptoEgreso = {
  ...mockConceptoIngreso,
  id: 2,
  codigo: 'EGR-GASTO',
  nombre: 'Gasto Operativo',
  tipo: 'EGRESO',
  afectaSaldo: 'DISMINUYE',
  requiereComprobante: false,
}

describe('POST /api/caja', () => {
  it('should create a caja with valid data and admin token', async () => {
    mockPrisma.fondoRotatorio.findUnique.mockResolvedValue(mockFondo as any)
    mockPrisma.caja.findUnique.mockResolvedValue(null)
    mockPrisma.caja.create.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.upsert.mockResolvedValue({} as any)
    vi.mocked(cajaService.crearConceptosPorDefecto).mockResolvedValue(undefined as any)

    const res = await request(app)
      .post('/api/caja')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Caja Principal',
        tipo: 'PRINCIPAL',
        moneda: 'PEN',
        fondoId: 1,
        saldoInicial: 1000,
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toHaveProperty('codigo')
    expect(res.body.message).toMatch(/creada/)
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/caja')
      .send({ nombre: 'Caja Test', tipo: 'PRINCIPAL', moneda: 'PEN', fondoId: 1 })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should return 403 for non-admin/tesorero roles', async () => {
    const vocalToken = generateAuthToken({ userId: 2, username: 'vocal', rol: 'VOCAL' })

    const res = await request(app)
      .post('/api/caja')
      .set('Authorization', `Bearer ${vocalToken}`)
      .send({ nombre: 'Caja Test', tipo: 'PRINCIPAL', moneda: 'PEN', fondoId: 1 })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('should return validation error on missing required fields', async () => {
    const res = await request(app)
      .post('/api/caja')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('GET /api/caja', () => {
  it('should list cajas with auth token', async () => {
    mockPrisma.caja.findMany.mockResolvedValue([mockCajaWithRelations] as any)
    mockPrisma.caja.count.mockResolvedValue(1)

    const res = await request(app).get('/api/caja').set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeInstanceOf(Array)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({
      id: 1,
      codigo: 'CAJ-001',
      nombre: 'Caja Principal',
    })
    expect(res.body.total).toBe(1)
    expect(res.body).toHaveProperty('page')
    expect(res.body).toHaveProperty('totalPages')
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/caja')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should support pagination', async () => {
    mockPrisma.caja.findMany.mockResolvedValue([] as any)
    mockPrisma.caja.count.mockResolvedValue(0)

    const res = await request(app)
      .get('/api/caja?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('should filter by estado', async () => {
    mockPrisma.caja.findMany.mockResolvedValue([mockCajaWithRelations] as any)
    mockPrisma.caja.count.mockResolvedValue(1)

    const res = await request(app)
      .get('/api/caja?estado=ACTIVA')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('POST /api/caja/movimientos', () => {
  it('should create a movement with sufficient balance', async () => {
    mockPrisma.caja.findUnique
      .mockResolvedValueOnce(mockCaja as any)
      .mockResolvedValueOnce(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConceptoIngreso as any)
    mockPrisma.movimientoCaja.findUnique.mockResolvedValue(null)

    const mockTx = {
      caja: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      movimientoCaja: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 1,
          codigo: 'MOV-TEST1234',
          tipo: 'INGRESO',
          monto: 500,
          estado: 'REGISTRADO',
          caja: mockCaja,
          concepto: mockConceptoIngreso,
        }),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 500,
        descripcion: 'Aporte test',
        comprobante: 'COMP-001',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toHaveProperty('codigo')
    expect(res.body.message).toMatch(/registrado/)
  })

  it('should return 400 on insufficient balance', async () => {
    const lowBalanceCaja = { ...mockCaja, saldoActual: 100 }
    mockPrisma.caja.findUnique
      .mockResolvedValueOnce(lowBalanceCaja as any)
      .mockResolvedValueOnce(lowBalanceCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConceptoEgreso as any)
    mockPrisma.movimientoCaja.findUnique.mockResolvedValue(null)

    const mockTx = {
      caja: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn(),
      },
      movimientoCaja: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 1,
        conceptoId: 2,
        tipo: 'EGRESO',
        monto: 500,
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/insuficiente/)
    expect(mockTx.movimientoCaja.create).not.toHaveBeenCalled()
  })

  it('should return 401 without auth token', async () => {
    const res = await request(app).post('/api/caja/movimientos').send({
      cajaId: 1,
      conceptoId: 1,
      tipo: 'INGRESO',
      monto: 100,
    })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 when concepto type does not match movement type', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConceptoIngreso as any)

    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'EGRESO',
        monto: 100,
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 on validation error (missing fields)', async () => {
    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 1,
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 when caja not found', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 999,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('should return 400 when caja is inactive', async () => {
    const inactiveCaja = { ...mockCaja, estado: 'CERRADA' }
    mockPrisma.caja.findUnique.mockResolvedValue(inactiveCaja as any)

    const res = await request(app)
      .post('/api/caja/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
