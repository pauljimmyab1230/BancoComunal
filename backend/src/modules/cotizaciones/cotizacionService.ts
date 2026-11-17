import { randomBytes } from 'crypto'
import prisma from '../../config/prisma'
import { HttpError } from '../../middleware/httpError'
import { createAuditLog } from '../../config/auditLog'
import { creditoService } from '../creditos/creditoService'
import type { Prisma } from '@prisma/client'
import type { z } from 'zod'
import type { createCotizacionSchema, updateCotizacionSchema } from './cotizacionValidation'

const ESTADOS_COTIZACION = ['BORRADOR', 'APROBADA', 'RECHAZADA', 'CONVERTIDA'] as const

function round2(n: number): number {
  return Math.round((n + Math.sign(n || 1) * 1e-9) * 100) / 100
}

function calcularAmortizacion(monto: number, tasaInteres: number, numeroCuotas: number) {
  const i = tasaInteres / 100
  const n = numeroCuotas
  const montoCuota = i > 0 ? (monto * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) : monto / n
  const totalInteres = montoCuota * n - monto
  return { montoCuota: round2(montoCuota), totalInteres: round2(totalInteres) }
}

function generarCodigo(): string {
  return 'COT-' + randomBytes(4).toString('hex').toUpperCase()
}

const socioSelect = {
  id: true,
  codigo: true,
  nombres: true,
  apellidoPaterno: true,
  apellidoMaterno: true,
  dni: true,
} as const

const fondoSelect = { id: true, nombre: true, moneda: true } as const

function serializeCotizacion<
  T extends {
    monto: unknown
    tasaInteres: unknown
    montoCuota: unknown
    totalInteres: unknown
  },
>(c: T) {
  return {
    ...c,
    monto: Number(c.monto),
    tasaInteres: Number(c.tasaInteres),
    montoCuota: Number(c.montoCuota),
    totalInteres: Number(c.totalInteres),
  }
}

export const cotizacionService = {
  async list(params: { search?: string; page?: number; limit?: number; estado?: string }) {
    const { search, page = 1, limit = 10, estado } = params
    const skip = (page - 1) * limit

    if (estado && !(ESTADOS_COTIZACION as readonly string[]).includes(estado)) {
      throw new HttpError(400, 'Estado inválido')
    }

    const where: Prisma.CotizacionWhereInput = {}
    if (estado) where.estado = estado
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { socio: { nombres: { contains: search } } },
        { socio: { apellidoPaterno: { contains: search } } },
        { fondo: { nombre: { contains: search } } },
      ]
    }

    const [data, total, porEstado] = await Promise.all([
      prisma.cotizacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { fondo: { select: fondoSelect }, socio: { select: socioSelect } },
      }),
      prisma.cotizacion.count({ where }),
      prisma.cotizacion.groupBy({ by: ['estado'], _count: { _all: true } }),
    ])

    const resumenEstados: Record<string, number> = {}
    for (const fila of porEstado) {
      resumenEstados[fila.estado] = fila._count._all
    }

    return {
      data: data.map(serializeCotizacion),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      resumenEstados,
    }
  },

  async getById(id: number) {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      include: { fondo: { select: fondoSelect }, socio: { select: socioSelect } },
    })
    if (!cotizacion) return null
    return serializeCotizacion(cotizacion)
  },

  async create(data: z.infer<typeof createCotizacionSchema>, usuarioId?: number) {
    const fechaPrimerVencimiento = new Date(data.fechaPrimerVencimiento)
    if (isNaN(fechaPrimerVencimiento.getTime())) {
      throw new HttpError(400, 'Fecha de primer vencimiento inválida')
    }

    const { montoCuota, totalInteres } = calcularAmortizacion(
      data.monto,
      data.tasaInteres,
      data.numeroCuotas
    )

    const cotizacion = await prisma.cotizacion.create({
      data: {
        codigo: generarCodigo(),
        monto: data.monto,
        tasaInteres: data.tasaInteres,
        numeroCuotas: data.numeroCuotas,
        fechaPrimerVencimiento,
        montoCuota,
        totalInteres,
        estado: 'BORRADOR',
        observacion: data.observacion || null,
        fondoId: data.fondoId ?? null,
        socioId: data.socioId ?? null,
      },
    })

    await createAuditLog({
      tabla: 'Cotizacion',
      registroId: cotizacion.id,
      operacion: 'CREATE',
      datosNuevos: {
        codigo: cotizacion.codigo,
        monto: Number(cotizacion.monto),
        tasaInteres: Number(cotizacion.tasaInteres),
        numeroCuotas: cotizacion.numeroCuotas,
      },
      usuarioId,
    })

    return serializeCotizacion(cotizacion)
  },

  async update(id: number, data: z.infer<typeof updateCotizacionSchema>, usuarioId?: number) {
    const existing = await prisma.cotizacion.findUnique({ where: { id } })
    if (!existing) throw new HttpError(404, 'Cotización no encontrada')
    if (existing.estado !== 'BORRADOR') {
      throw new HttpError(400, 'Solo se puede editar una cotización en borrador')
    }

    const monto = data.monto !== undefined ? data.monto : Number(existing.monto)
    const tasaInteres =
      data.tasaInteres !== undefined ? data.tasaInteres : Number(existing.tasaInteres)
    const numeroCuotas = data.numeroCuotas !== undefined ? data.numeroCuotas : existing.numeroCuotas

    const { montoCuota, totalInteres } = calcularAmortizacion(monto, tasaInteres, numeroCuotas)

    const updateData: Prisma.CotizacionUncheckedUpdateInput = {
      monto,
      tasaInteres,
      numeroCuotas,
      montoCuota,
      totalInteres,
    }
    if (data.fechaPrimerVencimiento !== undefined) {
      const fecha = new Date(data.fechaPrimerVencimiento)
      if (isNaN(fecha.getTime())) throw new HttpError(400, 'Fecha de primer vencimiento inválida')
      updateData.fechaPrimerVencimiento = fecha
    }
    if (data.fondoId !== undefined) updateData.fondoId = data.fondoId ?? null
    if (data.socioId !== undefined) updateData.socioId = data.socioId ?? null
    if (data.observacion !== undefined) updateData.observacion = data.observacion || null

    const updated = await prisma.cotizacion.update({ where: { id }, data: updateData })

    await createAuditLog({
      tabla: 'Cotizacion',
      registroId: id,
      operacion: 'UPDATE',
      datosAnteriores: {
        monto: Number(existing.monto),
        tasaInteres: Number(existing.tasaInteres),
        numeroCuotas: existing.numeroCuotas,
      },
      datosNuevos: updateData,
      usuarioId,
    })

    return serializeCotizacion(updated)
  },

  async cambiarEstado(
    id: number,
    estado: 'APROBADA' | 'RECHAZADA' | 'BORRADOR',
    usuarioId?: number
  ) {
    const existing = await prisma.cotizacion.findUnique({ where: { id } })
    if (!existing) throw new HttpError(404, 'Cotización no encontrada')
    if (existing.estado === 'CONVERTIDA') {
      throw new HttpError(400, 'La cotización ya fue convertida a crédito')
    }

    const updated = await prisma.cotizacion.update({
      where: { id },
      data: { estado },
    })

    await createAuditLog({
      tabla: 'Cotizacion',
      registroId: id,
      operacion: 'UPDATE',
      datosAnteriores: { estado: existing.estado },
      datosNuevos: { estado },
      usuarioId,
    })

    return serializeCotizacion(updated)
  },

  async convertir(id: number, usuarioId?: number) {
    const cotizacion = await prisma.cotizacion.findUnique({ where: { id } })
    if (!cotizacion) throw new HttpError(404, 'Cotización no encontrada')
    if (!['BORRADOR', 'APROBADA'].includes(cotizacion.estado)) {
      throw new HttpError(400, 'Solo se pueden convertir cotizaciones en borrador o aprobadas')
    }
    if (!cotizacion.fondoId || !cotizacion.socioId) {
      throw new HttpError(400, 'Asigne un fondo y un socio antes de convertir la cotización')
    }

    const prestamo = await creditoService.crear(
      {
        monto: Number(cotizacion.monto),
        tasaInteres: Number(cotizacion.tasaInteres),
        numeroCuotas: cotizacion.numeroCuotas,
        fechaPrimerVencimiento: cotizacion.fechaPrimerVencimiento.toISOString().slice(0, 10),
        fondoId: cotizacion.fondoId,
        socioId: cotizacion.socioId,
      },
      usuarioId
    )

    let updated
    try {
      updated = await prisma.cotizacion.update({
        where: { id },
        data: { estado: 'CONVERTIDA', prestamoId: prestamo.id },
      })
    } catch (error) {
      // Si falla el vínculo, se revierte el crédito para no dejar capital desembolsado sin sustento.
      await creditoService.anular(prestamo.id, usuarioId).catch(() => undefined)
      throw error
    }

    await createAuditLog({
      tabla: 'Cotizacion',
      registroId: id,
      operacion: 'CONVERTIR',
      datosAnteriores: { estado: cotizacion.estado },
      datosNuevos: { estado: 'CONVERTIDA', prestamoId: prestamo.id },
      usuarioId,
    })

    return { cotizacion: serializeCotizacion(updated), prestamoId: prestamo.id }
  },

  async delete(id: number, usuarioId?: number) {
    const cotizacion = await prisma.cotizacion.findUnique({ where: { id } })
    if (!cotizacion) return { success: false as const, message: 'Cotización no encontrada' }
    if (cotizacion.estado === 'CONVERTIDA') {
      return { success: false as const, message: 'No se puede eliminar una cotización convertida' }
    }

    await prisma.cotizacion.delete({ where: { id } })
    await createAuditLog({
      tabla: 'Cotizacion',
      registroId: id,
      operacion: 'DELETE',
      datosAnteriores: { codigo: cotizacion.codigo, estado: cotizacion.estado },
      usuarioId,
    })
    return { success: true as const, message: 'Cotización eliminada correctamente' }
  },
}
