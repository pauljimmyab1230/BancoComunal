export interface Usuario {
  id: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  username: string
  correo?: string
  telefono?: string
  rol: string
  estado: 'ACTIVO' | 'INACTIVO'
  ultimoAcceso?: string
  createdAt: string
}

export interface ConceptoCajaItem {
  id: number
  codigo: string
  nombre: string
  tipo: string
  afectaSaldo: string
  descripcion?: string
  requiereComprobante: boolean
  orden: number
  estado: string
}

export interface Organizacion {
  organizacion: string
  monedaDefault: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  estado?: string
  rol?: string
  tipo?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
