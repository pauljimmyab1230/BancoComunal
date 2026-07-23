import api from '@/lib/api'
import type { Socio, Beneficiario, DocumentoSocio, PaginatedResponse, ApiResponse } from '@/types'

export interface SociosQuery {
  search?: string
  page?: number
  limit?: number
  estado?: string
}

export const socioApi = {
  list: async (params?: SociosQuery): Promise<PaginatedResponse<Socio>> => {
    const { data } = await api.get('/socios', { params })
    return data
  },

  getById: async (id: number): Promise<ApiResponse<Socio>> => {
    const { data } = await api.get(`/socios/${id}`)
    return data
  },

  create: async (formData: FormData): Promise<ApiResponse<Socio>> => {
    const { data } = await api.post('/socios', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  update: async (id: number, formData: FormData): Promise<ApiResponse<Socio>> => {
    const { data } = await api.put(`/socios/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/socios/${id}`)
    return data
  },

  getBeneficiarios: async (socioId: number): Promise<ApiResponse<Beneficiario[]>> => {
    const { data } = await api.get(`/socios/${socioId}/beneficiarios`)
    return data
  },

  addBeneficiario: async (socioId: number, beneficiario: Partial<Beneficiario>): Promise<ApiResponse<Beneficiario>> => {
    const { data } = await api.post(`/socios/${socioId}/beneficiarios`, beneficiario)
    return data
  },

  updateBeneficiario: async (socioId: number, beneficiarioId: number, beneficiario: Partial<Beneficiario>): Promise<ApiResponse<Beneficiario>> => {
    const { data } = await api.put(`/socios/${socioId}/beneficiarios/${beneficiarioId}`, beneficiario)
    return data
  },

  deleteBeneficiario: async (socioId: number, beneficiarioId: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/socios/${socioId}/beneficiarios/${beneficiarioId}`)
    return data
  },

  getDocumentos: async (socioId: number): Promise<ApiResponse<DocumentoSocio[]>> => {
    const { data } = await api.get(`/socios/${socioId}/documentos`)
    return data
  },

  uploadDocumento: async (socioId: number, formData: FormData): Promise<ApiResponse<DocumentoSocio>> => {
    const { data } = await api.post(`/socios/${socioId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  deleteDocumento: async (socioId: number, documentoId: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/socios/${socioId}/documentos/${documentoId}`)
    return data
  },
}
