import api from '@/lib/api'
import type { DashboardData, DashboardEvolucion } from '../types'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardData> => {
    const { data } = await api.get('/dashboard/summary')
    return data.data
  },

  getEvolucion: async (meses = 12): Promise<DashboardEvolucion> => {
    const { data } = await api.get('/dashboard/evolucion', { params: { meses } })
    return data.data
  },
}
