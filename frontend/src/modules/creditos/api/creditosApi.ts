import api from '@/lib/api'
import type { ApiResponse } from '@/types'
import type { Prestamo, PrestamoFormData, PagoCuotaForm, CreditosListResponse } from '../types'

export interface PrestamosQuery {
  search?: string
  page?: number
  limit?: number
  fondoId?: number
  socioId?: number
  estado?: string
}

export const creditosApi = {
  list: async (params?: PrestamosQuery): Promise<CreditosListResponse> => {
    const { data } = await api.get('/creditos', { params })
    return data
  },

  getById: async (id: number): Promise<ApiResponse<Prestamo>> => {
    const { data } = await api.get(`/creditos/${id}`)
    return data
  },

  getByFondoSocio: async (fondoId: number, socioId: number): Promise<ApiResponse<Prestamo[]>> => {
    const { data } = await api.get(`/creditos/fondo/${fondoId}/socio/${socioId}`)
    return data
  },

  create: async (form: PrestamoFormData): Promise<ApiResponse<Prestamo>> => {
    const { data } = await api.post('/creditos', form)
    return data
  },

  update: async (id: number, form: Partial<PrestamoFormData>): Promise<ApiResponse<Prestamo>> => {
    const { data } = await api.put(`/creditos/${id}`, form)
    return data
  },

  pagarCuota: async (form: PagoCuotaForm): Promise<ApiResponse<any>> => {
    const { data } = await api.post('/creditos/pagar', form)
    return data
  },

  anular: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.put(`/creditos/${id}/anular`)
    return data
  },

  liquidar: async (form: { prestamoId: number; metodoPago: string; fechaPago?: string; comprobante?: string }): Promise<ApiResponse<any>> => {
    const { data } = await api.post('/creditos/liquidar', form)
    return data
  },
}
