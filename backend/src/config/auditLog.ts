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
  } catch { /* tabla puede no existir */ }
}
