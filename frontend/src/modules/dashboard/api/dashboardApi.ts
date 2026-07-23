import api from '@/lib/api'
import type { DashboardData } from '../types'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardData> => {
    const { data } = await api.get('/dashboard/summary')
    return data.data
  },
}
