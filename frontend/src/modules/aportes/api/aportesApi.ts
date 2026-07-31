import api from '@/lib/api'
import type { PaginatedResponse, ApiResponse } from '@/types'
import type { Aporte, AporteFormData } from '../types'

export interface AportesQuery {
  search?: string
  page?: number
  limit?: number
  estado?: string
  fondoId?: number
  socioId?: number
}

export interface AportesListResponse extends PaginatedResponse<Aporte> {
  totalAportado: number
  totalActivos: number
}

export const aportesApi = {
  list: async (params?: AportesQuery): Promise<AportesListResponse> => {
    const { data } = await api.get('/aportes', { params })
    return data
  },

  getById: async (id: number): Promise<ApiResponse<Aporte>> => {
    const { data } = await api.get(`/aportes/${id}`)
    return data
  },

  create: async (aporte: AporteFormData): Promise<ApiResponse<Aporte>> => {
    const { data } = await api.post('/aportes', aporte)
    return data
  },

  update: async (id: number, aporte: Partial<AporteFormData>): Promise<ApiResponse<Aporte>> => {
    const { data } = await api.put(`/aportes/${id}`, aporte)
    return data
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/aportes/${id}`)
    return data
  },
}
