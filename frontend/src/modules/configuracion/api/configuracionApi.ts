import api from '@/lib/api'
import type { Usuario, ConceptoCajaItem, Organizacion, PaginationParams, PaginatedResponse } from '../types'

export const configuracionApi = {
  // Login
  login: async (username: string, password: string) => {
    const { data } = await api.post('/configuracion/login', { username, password })
    return data
  },

  // Usuarios
  listUsuarios: async (params?: PaginationParams): Promise<PaginatedResponse<Usuario>> => {
    const { data } = await api.get('/configuracion/usuarios', { params })
    return data
  },

  getUsuarioById: async (id: number): Promise<Usuario> => {
    const { data } = await api.get(`/configuracion/usuarios/${id}`)
    return data.data
  },

  createUsuario: async (data: any) => {
    const res = await api.post('/configuracion/usuarios', data)
    return res.data
  },

  updateUsuario: async (id: number, data: any) => {
    const res = await api.put(`/configuracion/usuarios/${id}`, data)
    return res.data
  },

  updatePassword: async (id: number, password: string) => {
    const res = await api.put(`/configuracion/usuarios/${id}/password`, { password })
    return res.data
  },

  deleteUsuario: async (id: number) => {
    const res = await api.delete(`/configuracion/usuarios/${id}`)
    return res.data
  },

  // Conceptos de Caja
  listConceptos: async (params?: PaginationParams): Promise<PaginatedResponse<ConceptoCajaItem>> => {
    const { data } = await api.get('/configuracion/conceptos', { params })
    return data
  },

  getConceptoById: async (id: number): Promise<ConceptoCajaItem> => {
    const { data } = await api.get(`/configuracion/conceptos/${id}`)
    return data.data
  },

  createConcepto: async (data: any) => {
    const res = await api.post('/configuracion/conceptos', data)
    return res.data
  },

  updateConcepto: async (id: number, data: any) => {
    const res = await api.put(`/configuracion/conceptos/${id}`, data)
    return res.data
  },

  deleteConcepto: async (id: number) => {
    const res = await api.delete(`/configuracion/conceptos/${id}`)
    return res.data
  },

  // Organización
  getOrganizacion: async (): Promise<Organizacion> => {
    const { data } = await api.get('/configuracion/organizacion')
    return data.data
  },

  updateOrganizacion: async (data: any) => {
    const res = await api.put('/configuracion/organizacion', data)
    return res.data
  },
}
