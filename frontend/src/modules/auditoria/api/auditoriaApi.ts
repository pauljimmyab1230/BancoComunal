import api from '@/lib/api'
import type { AuditLogParams, PaginatedAuditLogs, AuditLogEntry, AuditLogStats } from '../types'

export const auditoriaApi = {
  list: async (params?: AuditLogParams): Promise<PaginatedAuditLogs> => {
    const { data } = await api.get('/auditoria', { params })
    return data
  },

  getById: async (id: number): Promise<AuditLogEntry> => {
    const { data } = await api.get(`/auditoria/${id}`)
    return data.data
  },

  getModules: async (): Promise<string[]> => {
    const { data } = await api.get('/auditoria/modules')
    return data.data
  },

  getStats: async (): Promise<AuditLogStats> => {
    const { data } = await api.get('/auditoria/stats')
    return data.data
  },
}
