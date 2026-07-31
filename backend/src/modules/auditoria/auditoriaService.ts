import prisma from '../../config/prisma'
import type { AuditLogQueryInput } from './auditoriaValidation'

export const auditoriaService = {
  async list(params: AuditLogQueryInput) {
    const { page, limit, tabla, operacion, fechaInicio, fechaFin } = params
    const where: any = {}

    if (tabla) where.tabla = tabla
    if (operacion) where.operacion = operacion
    if (fechaInicio || fechaFin) {
      where.createdAt = {}
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio)
      if (fechaFin) {
        const end = new Date(fechaFin)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getById(id: number) {
    return prisma.auditLog.findUnique({
      where: { id },
    })
  },

  async getModules() {
    const modules = await prisma.auditLog.findMany({
      select: { tabla: true },
      distinct: ['tabla'],
      orderBy: { tabla: 'asc' },
    })
    return modules.map((m) => m.tabla)
  },

  async getStats() {
    const [total, byOperacion, byModule, recentActivity] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({ by: ['operacion'], _count: true }),
      prisma.auditLog.groupBy({ by: ['tabla'], _count: true, orderBy: { _count: { tabla: 'desc' } } }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      total,
      byOperacion: byOperacion.reduce((acc, r) => ({ ...acc, [r.operacion]: r._count }), {} as Record<string, number>),
      byModule: byModule.map((m) => ({ tabla: m.tabla, count: m._count })),
      recentActivity,
    }
  },

  async create(data: { tabla: string; registroId: number; operacion: string; datosAnteriores?: any; datosNuevos?: any; ip?: string }) {
    return prisma.auditLog.create({ data })
  },
}
