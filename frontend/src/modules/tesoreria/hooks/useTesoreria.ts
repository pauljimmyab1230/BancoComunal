import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { tesoreriaApi } from '../api/tesoreriaApi'
import type { FlujoCajaParams } from '../types'

export function useDashboard(params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string }) {
  return useQuery({
    queryKey: ['tesoreriaDashboard', params],
    queryFn: () => tesoreriaApi.getDashboard(params),
  })
}

export function useFlujoCaja(params: FlujoCajaParams | null) {
  return useQuery({
    queryKey: ['flujoCaja', params],
    queryFn: () => tesoreriaApi.getFlujoCaja(params!),
    enabled: !!params,
  })
}

export function useConciliacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => tesoreriaApi.createConciliacion(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Conciliación realizada')
      queryClient.invalidateQueries({ queryKey: ['flujoCaja'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error en conciliación')
    },
  })
}

export function useTransferencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => tesoreriaApi.createTransferencia(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Transferencia realizada')
      queryClient.invalidateQueries({ queryKey: ['flujoCaja'] })
      queryClient.invalidateQueries({ queryKey: ['tesoreriaDashboard'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error en transferencia')
    },
  })
}

export function useProyeccion(params: { cajaId: number; meses?: number } | null) {
  return useQuery({
    queryKey: ['proyeccionFlujo', params],
    queryFn: () => tesoreriaApi.getProyeccion(params!),
    enabled: !!params?.cajaId,
  })
}
