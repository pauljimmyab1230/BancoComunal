import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { fondosApi, type FondosQuery } from '../api/fondosApi'

export function useFondos(params?: FondosQuery) {
  return useQuery({
    queryKey: ['fondos', params],
    queryFn: () => fondosApi.list(params),
  })
}

export function useFondo(id: number) {
  return useQuery({
    queryKey: ['fondo', id],
    queryFn: () => fondosApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateFondo() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => fondosApi.create(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Fondo creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      navigate(`/fondos/${res.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear fondo')
    },
  })
}

export function useUpdateFondo(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => fondosApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Fondo actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
      queryClient.invalidateQueries({ queryKey: ['fondo', id] })
      navigate(`/fondos/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar fondo')
    },
  })
}

export function useDeleteFondo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => fondosApi.delete(id),
    onSuccess: () => {
      toast.success('Fondo eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar fondo')
    },
  })
}
