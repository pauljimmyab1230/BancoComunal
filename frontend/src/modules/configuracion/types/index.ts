export interface Usuario {
  id: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno?: string
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
  /** Cantidad de movimientos de caja asociados al concepto. */
  movimientos?: number
}

export interface Organizacion {
  organizacion: string
  ruc: string
  direccion: string
  telefono: string
  email: string
  monedaDefault: string
  updatedAt?: string
}

export interface ResumenConfiguracion {
  usuarios: {
    total: number
    activos: number
    inactivos: number
    admins: number
  }
  conceptos: {
    total: number
    activos: number
    requierenComprobante: number
    afectanSaldo: number
  }
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
