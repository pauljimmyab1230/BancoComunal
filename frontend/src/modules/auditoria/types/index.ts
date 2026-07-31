export interface AuditLogEntry {
  id: number
  tabla: string
  registroId: number
  operacion: 'CREATE' | 'UPDATE' | 'DELETE'
  datosAnteriores?: Record<string, any>
  datosNuevos?: Record<string, any>
  ip?: string
  createdAt: string
}

export interface AuditLogStats {
  total: number
  byOperacion: Record<string, number>
  byModule: { tabla: string; count: number }[]
  recentActivity: AuditLogEntry[]
}

export interface AuditLogParams {
  page?: number
  limit?: number
  tabla?: string
  operacion?: string
  fechaInicio?: string
  fechaFin?: string
}

export interface PaginatedAuditLogs {
  success: boolean
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}
