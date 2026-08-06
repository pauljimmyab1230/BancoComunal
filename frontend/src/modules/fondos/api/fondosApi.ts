import api from '@/lib/api'
import type { PaginatedResponse, ApiResponse } from '@/types'
import type { FondoRotatorio, FondoSocio } from '../types'

export interface FondosQuery {
  search?: string
  page?: number
  limit?: number
  estado?: string
}

export interface CapitalResumen {
  moneda: string
  capitalInicial: number
  capitalDisponible: number
}

export interface FondosListResponse extends PaginatedResponse<FondoRotatorio> {
  capitalResumen: CapitalResumen[]
  totalSocios: number
}

export const fondosApi = {
  list: async (params?: FondosQuery): Promise<FondosListResponse> => {
    const { data } = await api.get('/fondos', { params })
    return data
  },

  getById: async (id: number): Promise<ApiResponse<FondoRotatorio>> => {
    const { data } = await api.get(`/fondos/${id}`)
    return data
  },

  create: async (fondo: Partial<FondoRotatorio>): Promise<ApiResponse<FondoRotatorio>> => {
    const { data } = await api.post('/fondos', fondo)
    return data
  },

  update: async (id: number, fondo: Partial<FondoRotatorio>): Promise<ApiResponse<FondoRotatorio>> => {
    const { data } = await api.put(`/fondos/${id}`, fondo)
    return data
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/fondos/${id}`)
    return data
  },

  getSocios: async (fondoId: number): Promise<ApiResponse<FondoSocio[]>> => {
    const { data } = await api.get(`/fondos/${fondoId}/socios`)
    return data
  },

  addSocio: async (fondoId: number, socioId: number): Promise<ApiResponse<FondoSocio>> => {
    const { data } = await api.post(`/fondos/${fondoId}/socios`, { socioId })
    return data
  },

  removeSocio: async (fondoId: number, socioId: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/fondos/${fondoId}/socios/${socioId}`)
    return data
  },
}
