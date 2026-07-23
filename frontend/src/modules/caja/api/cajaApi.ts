import api from '@/lib/api'
import type {
  Caja,
  ConceptoCaja,
  MovimientoCaja,
  ArqueoCaja,
  FlujoCajaProyectado,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
  CreateCajaInput,
  UpdateCajaInput,
  CreateMovimientoInput,
  CreateArqueoInput,
  AprobarArqueoInput,
  CreateFlujoProyectadoInput,
} from '../types'

export const cajaApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<Caja>> => {
    const { data } = await api.get('/caja', { params })
    return data
  },

  getById: async (id: number): Promise<Caja> => {
    const { data } = await api.get(`/caja/${id}`)
    return data.data
  },

  create: async (data: CreateCajaInput): Promise<{ message: string; data: Caja }> => {
    const res = await api.post('/caja', data)
    return res.data
  },

  update: async (id: number, data: UpdateCajaInput): Promise<{ message: string; data: Caja }> => {
    const res = await api.put(`/caja/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/caja/${id}`)
    return res.data
  },

  getResumen: async (cajaId: number) => {
    const { data } = await api.get(`/caja/resumen/${cajaId}`)
    return data.data
  },

  listConceptos: async (params?: { estado?: string; tipo?: string }): Promise<ConceptoCaja[]> => {
    const { data } = await api.get('/caja/conceptos', { params })
    return data.data
  },

  createConcepto: async (data: Omit<ConceptoCaja, 'id' | 'estado'>): Promise<{ message: string; data: ConceptoCaja }> => {
    const res = await api.post('/caja/conceptos', data)
    return res.data
  },

  updateConcepto: async (id: number, data: Partial<ConceptoCaja>): Promise<{ message: string; data: ConceptoCaja }> => {
    const res = await api.put(`/caja/conceptos/${id}`, data)
    return res.data
  },

  deleteConcepto: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/caja/conceptos/${id}`)
    return res.data
  },

  listMovimientos: async (params?: PaginationParams): Promise<PaginatedResponse<MovimientoCaja>> => {
    const { data } = await api.get('/caja/movimientos', { params })
    return data
  },

  getMovimientoById: async (id: number): Promise<MovimientoCaja> => {
    const { data } = await api.get(`/caja/movimientos/${id}`)
    return data.data
  },

  createMovimiento: async (data: CreateMovimientoInput): Promise<{ message: string; data: MovimientoCaja }> => {
    const res = await api.post('/caja/movimientos', data)
    return res.data
  },

  anularMovimiento: async (id: number): Promise<{ message: string }> => {
    const res = await api.post(`/caja/movimientos/${id}/anular`)
    return res.data
  },

  listArqueos: async (params?: PaginationParams): Promise<PaginatedResponse<ArqueoCaja>> => {
    const { data } = await api.get('/caja/arqueos', { params })
    return data
  },

  getArqueoById: async (id: number): Promise<ArqueoCaja> => {
    const { data } = await api.get(`/caja/arqueos/${id}`)
    return data.data
  },

  createArqueo: async (data: CreateArqueoInput): Promise<{ message: string; data: ArqueoCaja }> => {
    const res = await api.post('/caja/arqueos', data)
    return res.data
  },

  aprobarArqueo: async (id: number, data: AprobarArqueoInput): Promise<{ message: string; data: ArqueoCaja }> => {
    const res = await api.post(`/caja/arqueos/${id}/aprobar`, data)
    return res.data
  },

  listFlujoProyectado: async (params?: { cajaId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }): Promise<FlujoCajaProyectado[]> => {
    const { data } = await api.get('/caja/flujo-proyectado', { params })
    return data.data
  },

  createFlujoProyectado: async (data: CreateFlujoProyectadoInput): Promise<{ message: string; data: FlujoCajaProyectado }> => {
    const res = await api.post('/caja/flujo-proyectado', data)
    return res.data
  },

  updateFlujoProyectado: async (id: number, data: Partial<CreateFlujoProyectadoInput>): Promise<{ message: string; data: FlujoCajaProyectado }> => {
    const res = await api.put(`/caja/flujo-proyectado/${id}`, data)
    return res.data
  },

  deleteFlujoProyectado: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/caja/flujo-proyectado/${id}`)
    return res.data
  },
}