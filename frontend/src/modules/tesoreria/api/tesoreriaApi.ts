import api from '@/lib/api'
import type { FlujoCajaGrupo, FlujoCajaParams } from '../types'

export const tesoreriaApi = {
  getDashboard: async (params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string }) => {
    const { data } = await api.get('/tesoreria/resumen-caja', { params })
    return data.data
  },

  getFlujoCaja: async (params: FlujoCajaParams): Promise<FlujoCajaGrupo[]> => {
    const { data } = await api.get('/tesoreria/flujo-caja', { params })
    return data.data
  },

  createConciliacion: async (params: any) => {
    const res = await api.post('/tesoreria/conciliacion-bancaria', params)
    return res.data
  },

  createTransferencia: async (params: any) => {
    const res = await api.post('/tesoreria/transferencia', params)
    return res.data
  },

  getProyeccion: async (params: { cajaId: number; meses?: number }) => {
    const { data } = await api.get('/tesoreria/proyeccion-flujo', { params })
    return data.data
  },
}
