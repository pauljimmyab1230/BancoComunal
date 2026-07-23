import { useQuery } from '@tanstack/react-query'
import { auditoriaApi } from '../api/auditoriaApi'
import type { AuditLogParams } from '../types'

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => auditoriaApi.list(params),
  })
}

export function useAuditLog(id: number) {
  return useQuery({
    queryKey: ['auditLog', id],
    queryFn: () => auditoriaApi.getById(id),
    enabled: !!id,
  })
}

export function useAuditModules() {
  return useQuery({
    queryKey: ['auditModules'],
    queryFn: () => auditoriaApi.getModules(),
  })
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['auditStats'],
    queryFn: () => auditoriaApi.getStats(),
  })
}
