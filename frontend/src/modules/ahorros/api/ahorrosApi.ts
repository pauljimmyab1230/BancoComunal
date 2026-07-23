import api from '@/lib/api'
import type { PaginatedResponse, ApiResponse } from '@/types'
import type { CuentaAhorro, AhorroMovimiento, CrearCuentaForm, CrearMovimientoForm } from '../types'

export interface CuentasQuery {
  search?: string
  page?: number
  limit?: number
  fondoId?: number
  socioId?: number
}

export const ahorrosApi = {
  listCuentas: async (params?: CuentasQuery): Promise<PaginatedResponse<CuentaAhorro>> => {
    const { data } = await api.get('/ahorros/cuentas', { params })
    return data
  },

  getCuenta: async (id: number, movPage?: number, movLimit?: number): Promise<ApiResponse<CuentaAhorro>> => {
    const params: Record<string, any> = {}
    if (movPage) params.movPage = movPage
    if (movLimit) params.movLimit = movLimit
    const { data } = await api.get(`/ahorros/cuentas/${id}`, { params })
    return data
  },

  crearCuenta: async (form: CrearCuentaForm): Promise<ApiResponse<CuentaAhorro>> => {
    const { data } = await api.post('/ahorros/cuentas', form)
    return data
  },

  getCuentaPorFondoSocio: async (fondoId: number, socioId: number): Promise<ApiResponse<CuentaAhorro>> => {
    const { data } = await api.get(`/ahorros/cuentas/fondo/${fondoId}/socio/${socioId}`)
    return data
  },

  actualizarEstado: async (id: number, estado: string): Promise<ApiResponse<CuentaAhorro>> => {
    const { data } = await api.put(`/ahorros/cuentas/${id}/estado`, { estado })
    return data
  },

  crearMovimiento: async (form: CrearMovimientoForm): Promise<ApiResponse<AhorroMovimiento>> => {
    const { data } = await api.post('/ahorros/movimientos', form)
    return data
  },

  listMovimientos: async (params?: { page?: number; limit?: number; cuentaId?: number }): Promise<PaginatedResponse<AhorroMovimiento>> => {
    const { data } = await api.get('/ahorros/movimientos', { params })
    return data
  },
}
