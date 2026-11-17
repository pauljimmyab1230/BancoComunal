import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 30000,
  })
}

export function useEvolucionDashboard(meses = 12) {
  return useQuery({
    queryKey: ['dashboard', 'evolucion', meses],
    queryFn: () => dashboardApi.getEvolucion(meses),
    staleTime: 60_000,
  })
}
