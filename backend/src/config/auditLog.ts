import prisma from './prisma'

export async function createAuditLog(data: {
  tabla: string
  registroId: number
  operacion: string
  datosAnteriores?: any
  datosNuevos?: any
}) {
  try {
    await prisma.auditLog.create({ data })
  } catch (error) {
    console.error('[AuditLog] Error al crear registro de auditoría:', error)
  }
}
