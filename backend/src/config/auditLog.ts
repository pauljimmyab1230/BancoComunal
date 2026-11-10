import prisma from './prisma'
import type { Prisma } from '@prisma/client'
import { logger } from './logger'

export async function createAuditLog(data: {
  tabla: string
  registroId: number
  operacion: string
  datosAnteriores?: Record<string, unknown>
  datosNuevos?: Record<string, unknown>
  usuarioId?: number
  ip?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tabla: data.tabla,
        registroId: data.registroId,
        operacion: data.operacion,
        datosAnteriores: data.datosAnteriores as Prisma.InputJsonValue | undefined,
        datosNuevos: data.datosNuevos as Prisma.InputJsonValue | undefined,
        usuarioId: data.usuarioId ?? null,
        ip: data.ip ?? null,
      },
    })
  } catch (error) {
    logger.error('[AuditLog] Error al crear registro de auditoria:', error)
  }
}
