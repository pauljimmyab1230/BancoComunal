import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../config/prisma', () => ({
  default: {
    caja: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    conceptoCaja: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    movimientoCaja: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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
  },
}))

vi.mock('./movimientoHelper', () => ({
  generateCodigo: vi.fn().mockReturnValue('MOV-ABCDEF1234'),
}))

vi.mock('../../config/env', () => ({
  env: {
    UPLOAD_DIR: 'uploads',
  },
}))

import { cajaService } from './cajaService'
import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'

const mockPrisma = vi.mocked(prisma)

beforeEach(() => {
  vi.clearAllMocks()
})

const mockCaja = {
  id: 1,
  codigo: 'CAJ-001',
  nombre: 'Caja Principal',
  descripcion: 'Caja principal del fondo',
  tipo: 'PRINCIPAL',
  moneda: 'PEN',
  saldoInicial: 1000,
  saldoActual: 5000,
  fondoId: 1,
  estado: 'ACTIVA',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockConcepto = {
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
  ...mockConcepto,
  id: 2,
  codigo: 'EGR-GASTO',
  nombre: 'Gasto Operativo',
  tipo: 'EGRESO',
  afectaSaldo: 'DISMINUYE',
  requiereComprobante: false,
}

describe('cajaService.createMovimiento', () => {
  it('should create a movement with sufficient balance (INGRESO/AUMENTA)', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConcepto as any)
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
          codigo: 'MOV-ABCDEF1234',
          tipo: 'INGRESO',
          monto: 500,
          estado: 'REGISTRADO',
          caja: mockCaja,
          concepto: mockConcepto,
        }),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    const result = await cajaService.createMovimiento({
      cajaId: 1,
      conceptoId: 1,
      tipo: 'INGRESO',
      monto: 500,
      descripcion: 'Aporte test',
      comprobante: 'COMPROBANTE-001',
    })

    expect(mockPrisma.caja.findUnique).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(mockPrisma.conceptoCaja.findUnique).toHaveBeenCalledWith({ where: { id: 1 } })
    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockTx.caja.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { saldoActual: { increment: 500 } },
    })
    expect(result).toHaveProperty('id', 1)
  })

  it('should create a movement that decreases balance (EGRESO/DISMINUYE)', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConceptoEgreso as any)
    mockPrisma.movimientoCaja.findUnique.mockResolvedValue(null)

    const mockTx = {
      caja: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      movimientoCaja: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 2,
          codigo: 'MOV-XYZ789',
          tipo: 'EGRESO',
          monto: 300,
          estado: 'REGISTRADO',
          caja: mockCaja,
          concepto: mockConceptoEgreso,
        }),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    const result = await cajaService.createMovimiento({
      cajaId: 1,
      conceptoId: 2,
      tipo: 'EGRESO',
      monto: 300,
    })

    expect(mockTx.caja.updateMany).toHaveBeenCalledWith({
      where: { id: 1, saldoActual: { gte: 300 } },
      data: { saldoActual: { increment: -300 } },
    })
    expect(result).toHaveProperty('id', 2)
  })

  it('should reject movement when caja not found', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(null)

    await expect(
      cajaService.createMovimiento({
        cajaId: 999,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
      })
    ).rejects.toThrow(new HttpError(400, 'Caja no encontrada'))
  })

  it('should reject movement when caja is not active', async () => {
    const inactiveCaja = { ...mockCaja, estado: 'CERRADA' }
    mockPrisma.caja.findUnique.mockResolvedValue(inactiveCaja as any)

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
      })
    ).rejects.toThrow(new HttpError(400, 'La caja no está activa'))
  })

  it('should reject movement when concepto not found', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(null)

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 999,
        tipo: 'INGRESO',
        monto: 100,
      })
    ).rejects.toThrow(new HttpError(400, 'Concepto no encontrado'))
  })

  it('should reject movement when concepto is inactive', async () => {
    const inactiveConcepto = { ...mockConcepto, estado: 'INACTIVO' }
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(inactiveConcepto as any)

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
      })
    ).rejects.toThrow(new HttpError(400, 'El concepto de caja no está activo'))
  })

  it('should reject movement when tipo does not match concepto tipo', async () => {
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConcepto as any) // INGRESO concepto

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'EGRESO', // Mismatch: concepto is INGRESO
        monto: 100,
      })
    ).rejects.toThrow(
      new HttpError(400, 'El tipo del movimiento (EGRESO) no corresponde al concepto (INGRESO)')
    )
  })

  it('should reject movement when comprobante is required but missing', async () => {
    const conceptoRequiere = { ...mockConcepto, requiereComprobante: true }
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(conceptoRequiere as any)

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 1,
        tipo: 'INGRESO',
        monto: 100,
        // comprobante omitted
      })
    ).rejects.toThrow(new HttpError(400, 'El concepto requiere número de comprobante'))
  })

  it('should reject insufficient balance atomically (updateMany returns count 0)', async () => {
    const cajaLowBalance = { ...mockCaja, saldoActual: 100 }
    mockPrisma.caja.findUnique.mockResolvedValue(cajaLowBalance as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(mockConceptoEgreso as any) // EGRESO/DISMINUYE
    mockPrisma.movimientoCaja.findUnique.mockResolvedValue(null)

    const mockTx = {
      caja: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // insufficient balance
        update: vi.fn(),
      },
      movimientoCaja: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 2,
        tipo: 'EGRESO',
        monto: 500, // balance is only 100
      })
    ).rejects.toThrow(new HttpError(400, 'Saldo insuficiente en caja para realizar el movimiento'))

    // Movement should NOT have been created
    expect(mockTx.movimientoCaja.create).not.toHaveBeenCalled()
  })

  it('should not create movement record if balance update fails (atomicity)', async () => {
    const cajaLowBalance = { ...mockCaja, saldoActual: 50 }
    mockPrisma.caja.findUnique.mockResolvedValue(cajaLowBalance as any)
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

    await expect(
      cajaService.createMovimiento({
        cajaId: 1,
        conceptoId: 2,
        tipo: 'EGRESO',
        monto: 500,
      })
    ).rejects.toThrow()

    expect(mockTx.movimientoCaja.create).not.toHaveBeenCalled()
    expect(mockTx.caja.update).not.toHaveBeenCalled()
  })

  it('should handle NO_AFECTA concept without balance changes', async () => {
    const conceptoNoAfecta = {
      ...mockConcepto,
      tipo: 'TRANSFERENCIA',
      afectaSaldo: 'NO_AFECTA',
      requiereComprobante: false,
    }
    mockPrisma.caja.findUnique.mockResolvedValue(mockCaja as any)
    mockPrisma.conceptoCaja.findUnique.mockResolvedValue(conceptoNoAfecta as any)
    mockPrisma.movimientoCaja.findUnique.mockResolvedValue(null)

    const mockTx = {
      caja: {
        updateMany: vi.fn(),
        update: vi.fn(),
      },
      movimientoCaja: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 3,
          codigo: 'MOV-NOAFECTA',
          tipo: 'TRANSFERENCIA',
          monto: 1000,
          estado: 'REGISTRADO',
          caja: mockCaja,
          concepto: conceptoNoAfecta,
        }),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx))

    const result = await cajaService.createMovimiento({
      cajaId: 1,
      conceptoId: 1,
      tipo: 'TRANSFERENCIA',
      monto: 1000,
    })

    // No balance update should have been attempted
    expect(mockTx.caja.updateMany).not.toHaveBeenCalled()
    expect(mockTx.caja.update).not.toHaveBeenCalled()
    expect(mockTx.movimientoCaja.create).toHaveBeenCalled()
    expect(result).toHaveProperty('id', 3)
  })
})
