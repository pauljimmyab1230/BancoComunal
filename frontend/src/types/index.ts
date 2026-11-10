export type { Socio, Beneficiario, DocumentoSocio, SocioFormData } from '../modules/socios/types'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
