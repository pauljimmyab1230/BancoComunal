export interface AuditLogEntry {
  id: number
  tabla: string
  registroId: number
  operacion: 'CREATE' | 'UPDATE' | 'DELETE'
  datosAnteriores?: Record<string, any>
  datosNuevos?: Record<string, any>
  ip?: string
  createdAt: string
  usuario: {
    id: number
    nombres: string
    apellidoPaterno: string
    username: string
  }
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
  usuarioId?: number
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
