import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { aportesApi, type AportesQuery } from '../api/aportesApi'

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || fallback
}

export function useAportes(params?: AportesQuery) {
  return useQuery({
    queryKey: ['aportes', params],
    queryFn: () => aportesApi.list(params),
  })
}

export function useAporte(id: number) {
  return useQuery({
    queryKey: ['aporte', id],
    queryFn: () => aportesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateAporte() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => aportesApi.create(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Aporte registrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['aportes'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      navigate('/aportes')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al registrar aporte'))
    },
  })
}

export function useUpdateAporte(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => aportesApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Aporte actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['aportes'] })
      queryClient.invalidateQueries({ queryKey: ['aporte', id] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      navigate('/aportes')
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al actualizar aporte'))
    },
  })
}

export function useDeleteAporte() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => aportesApi.delete(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Aporte anulado correctamente')
      queryClient.invalidateQueries({ queryKey: ['aportes'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al anular aporte'))
    },
  })
}
