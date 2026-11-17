import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { cotizacionesApi, type CotizacionesQuery } from '../api/cotizacionesApi'
import type { CotizacionFormData, EstadoCotizacion } from '../types'

export function useCotizaciones(params?: CotizacionesQuery) {
  return useQuery({
    queryKey: ['cotizaciones', params],
    queryFn: () => cotizacionesApi.list(params),
  })
}

export function useCotizacion(id: number) {
  return useQuery({
    queryKey: ['cotizacion', id],
    queryFn: () => cotizacionesApi.getById(id),
    enabled: !!id,
  })
}

export function useCrearCotizacion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ data, aprobar }: { data: CotizacionFormData; aprobar?: boolean }) => {
      const res = await cotizacionesApi.create(data)
      if (aprobar && res.data?.id) {
        await cotizacionesApi.cambiarEstado(res.data.id, 'APROBADA')
      }
      return { ...res, aprobada: !!aprobar }
    },
    onSuccess: (res) => {
      toast.success(
        res.aprobada
          ? 'Cotización creada y aprobada correctamente'
          : 'Cotización guardada correctamente'
      )
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      navigate(`/cotizaciones/${res.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la cotización')
    },
  })
}

export function useActualizarCotizacion(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: Partial<CotizacionFormData>) => cotizacionesApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Cotización actualizada correctamente')
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizacion', id] })
      navigate(`/cotizaciones/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la cotización')
    },
  })
}

export function useCambiarEstadoCotizacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoCotizacion }) =>
      cotizacionesApi.cambiarEstado(id, estado),
    onSuccess: (res) => {
      toast.success(res.message || 'Estado actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizacion'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar el estado')
    },
  })
}

export function useConvertirCotizacion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: number) => cotizacionesApi.convertir(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Cotización convertida en crédito correctamente')
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizacion'] })
      queryClient.invalidateQueries({ queryKey: ['creditos'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate(`/creditos/${res.data.prestamoId}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al convertir la cotización')
    },
  })
}

export function useEliminarCotizacion() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: number) => cotizacionesApi.eliminar(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Cotización eliminada correctamente')
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      navigate('/cotizaciones')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la cotización')
    },
  })
}
