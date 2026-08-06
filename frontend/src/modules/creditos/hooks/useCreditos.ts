import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { creditosApi, type PrestamosQuery } from '../api/creditosApi'

export function useCreditos(params?: PrestamosQuery) {
  return useQuery({
    queryKey: ['creditos', params],
    queryFn: () => creditosApi.list(params),
  })
}

export function useCredito(id: number) {
  return useQuery({
    queryKey: ['credito', id],
    queryFn: () => creditosApi.getById(id),
    enabled: !!id,
  })
}

export function useCrearCredito() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => creditosApi.create(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Préstamo creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['creditos'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      navigate(`/creditos/${res.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear préstamo')
    },
  })
}

export function useActualizarCredito(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => creditosApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Préstamo actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['creditos'] })
      queryClient.invalidateQueries({ queryKey: ['credito', id] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      navigate(`/creditos/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar préstamo')
    },
  })
}

export function usePagarCuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => creditosApi.pagarCuota(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Pago registrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['credito'] })
      queryClient.invalidateQueries({ queryKey: ['creditos'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['reportes'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar pago')
    },
  })
}

export function useAnularCredito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => creditosApi.anular(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Préstamo anulado correctamente')
      queryClient.invalidateQueries({ queryKey: ['creditos'] })
      queryClient.invalidateQueries({ queryKey: ['credito'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anular préstamo')
    },
  })
}
