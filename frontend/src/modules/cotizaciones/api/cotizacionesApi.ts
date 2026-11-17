import api from '@/lib/api'
import type { ApiResponse } from '@/types'
import type {
  Cotizacion,
  CotizacionFormData,
  CotizacionesListResponse,
  EstadoCotizacion,
} from '../types'

export interface CotizacionesQuery {
  search?: string
  page?: number
  limit?: number
  estado?: string
}

export interface ResultadoConversion {
  cotizacion: Cotizacion
  prestamoId: number
}

export const cotizacionesApi = {
  list: async (params?: CotizacionesQuery): Promise<CotizacionesListResponse> => {
    const { data } = await api.get('/cotizaciones', { params })
    return data
  },

  getById: async (id: number): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await api.get(`/cotizaciones/${id}`)
    return data
  },

  create: async (form: CotizacionFormData): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await api.post('/cotizaciones', form)
    return data
  },

  update: async (
    id: number,
    form: Partial<CotizacionFormData>
  ): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await api.put(`/cotizaciones/${id}`, form)
    return data
  },

  cambiarEstado: async (id: number, estado: EstadoCotizacion): Promise<ApiResponse<Cotizacion>> => {
    const { data } = await api.put(`/cotizaciones/${id}/estado`, { estado })
    return data
  },

  convertir: async (id: number): Promise<ApiResponse<ResultadoConversion>> => {
    const { data } = await api.post(`/cotizaciones/${id}/convertir`)
    return data
  },

  eliminar: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/cotizaciones/${id}`)
    return data
  },
}
