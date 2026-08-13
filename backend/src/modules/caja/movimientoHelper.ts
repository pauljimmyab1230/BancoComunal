import type { Prisma } from '@prisma/client'
import { HttpError } from '../../middleware/httpError'

export function generateCodigo(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export interface RegistroMovimientoCajaData {
  cajaId: number
  conceptoId: number
  tipo: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA'
  monto: number
  descripcion?: string
  comprobante?: string
  metodoPago?: string
  referencia?: string
  fechaMovimiento?: Date
}

export async function registrarMovimientoCaja(
  tx: Prisma.TransactionClient,
  data: RegistroMovimientoCajaData,
) {
  const [caja, concepto] = await Promise.all([
    tx.caja.findUnique({ where: { id: data.cajaId } }),
    tx.conceptoCaja.findUnique({ where: { id: data.conceptoId } }),
  ])

  if (!caja) throw new HttpError(400, 'Caja no encontrada')
  if (caja.estado !== 'ACTIVA') throw new HttpError(400, 'La caja no está activa')
  if (!concepto) throw new HttpError(400, 'Concepto de caja no encontrado')
  if (concepto.estado !== 'ACTIVO') throw new HttpError(400, 'El concepto de caja no está activo')

  const saldoActual = Number(caja.saldoActual)
  let delta = 0
  if (concepto.afectaSaldo === 'AUMENTA') delta = data.monto
  else if (concepto.afectaSaldo === 'DISMINUYE') delta = -data.monto

  if (delta < 0 && saldoActual + delta < 0) {
    throw new HttpError(400, 'Saldo insuficiente en caja para realizar el movimiento')
  }

  const mov = await tx.movimientoCaja.create({
    data: {
      codigo: generateCodigo('MOV-'),
      tipo: data.tipo,
      monto: data.monto,
      descripcion: data.descripcion || null,
      comprobante: data.comprobante || null,
      metodoPago: data.metodoPago || 'EFECTIVO',
      referencia: data.referencia || null,
      fechaMovimiento: data.fechaMovimiento || new Date(),
      estado: 'REGISTRADO',
      cajaId: data.cajaId,
      conceptoId: data.conceptoId,
    },
  })

  await tx.caja.update({
    where: { id: data.cajaId },
    data: { saldoActual: { increment: delta } },
  })

  return mov
}

export async function findCajaFondo(tx: Prisma.TransactionClient, fondoId: number) {
  const principal = await tx.caja.findFirst({
    where: { fondoId, estado: 'ACTIVA', tipo: 'PRINCIPAL' },
  })
  if (principal) return principal
  return tx.caja.findFirst({ where: { fondoId, estado: 'ACTIVA' } })
}

export async function findConceptoCodigo(tx: Prisma.TransactionClient, codigo: string) {
  return tx.conceptoCaja.findUnique({ where: { codigo } })
}

/**
 * Registra un movimiento de caja vinculado a un fondo.
 * Es estricto: si el fondo no tiene una caja activa o no existe el concepto,
 * la operación falla para garantizar que la caja refleje SIEMPRE los
 * movimientos del fondo (aportes, desembolsos, cobros, gastos).
 */
export async function registrarMovimientoFondo(
  tx: Prisma.TransactionClient,
  fondoId: number,
  conceptoCodigo: string,
  data: Omit<RegistroMovimientoCajaData, 'cajaId' | 'conceptoId'>,
) {
  const [caja, concepto] = await Promise.all([
    findCajaFondo(tx, fondoId),
    findConceptoCodigo(tx, conceptoCodigo),
  ])
  if (!caja) {
    throw new HttpError(
      400,
      'El fondo no tiene una caja activa para registrar sus movimientos. Crea una caja para este fondo.',
    )
  }
  if (!concepto) {
    throw new HttpError(400, `Concepto de caja ${conceptoCodigo} no configurado`)
  }
  return registrarMovimientoCaja(tx, {
    ...data,
    cajaId: caja.id,
    conceptoId: concepto.id,
  })
}

/**
 * Actualiza el monto y/o la fecha de un movimiento de caja vinculado
 * (p.ej. cuando se modifica un aporte). Devuelve null si no existe.
 */
export async function actualizarMovimientoCajaVinculado(
  tx: Prisma.TransactionClient,
  referencia: string,
  p: {
    deltaMonto?: number
    fechaMovimiento?: Date
    metodoPago?: string
    comprobante?: string | null
  },
) {
  const mov = await tx.movimientoCaja.findFirst({
    where: { referencia, estado: { not: 'ANULADO' } },
  })
  if (!mov) return null

  const updateData: any = {}
  if (p.deltaMonto !== undefined && p.deltaMonto !== 0) {
    updateData.monto = { increment: p.deltaMonto }
  }
  if (p.fechaMovimiento) updateData.fechaMovimiento = p.fechaMovimiento
  if (p.metodoPago !== undefined) updateData.metodoPago = p.metodoPago
  if (p.comprobante !== undefined) updateData.comprobante = p.comprobante || null

  if (Object.keys(updateData).length > 0) {
    await tx.movimientoCaja.update({ where: { id: mov.id }, data: updateData })
  }

  if (p.deltaMonto !== undefined && p.deltaMonto !== 0) {
    const caja = await tx.caja.findUnique({ where: { id: mov.cajaId } })
    if (caja && Number(caja.saldoActual) + p.deltaMonto < 0) {
      throw new HttpError(400, 'Saldo insuficiente en caja para el ajuste del movimiento')
    }
    await tx.caja.update({
      where: { id: mov.cajaId },
      data: { saldoActual: { increment: p.deltaMonto } },
    })
  }

  return mov
}

/**
 * Anula el movimiento de caja vinculado y revierte su efecto en el saldo.
 * Devuelve null si no existe.
 */
export async function anularMovimientoCajaVinculado(
  tx: Prisma.TransactionClient,
  referencia: string,
) {
  const mov = await tx.movimientoCaja.findFirst({
    where: { referencia, estado: { not: 'ANULADO' } },
    include: { concepto: true },
  })
  if (!mov) return null

  let delta = 0
  if (mov.concepto?.afectaSaldo === 'AUMENTA') delta = -Number(mov.monto)
  else if (mov.concepto?.afectaSaldo === 'DISMINUYE') delta = Number(mov.monto)

  await tx.movimientoCaja.update({ where: { id: mov.id }, data: { estado: 'ANULADO' } })
  await tx.caja.update({
    where: { id: mov.cajaId },
    data: { saldoActual: { increment: delta } },
  })

  return mov
}
