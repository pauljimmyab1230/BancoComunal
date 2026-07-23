import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { socioApi, type SociosQuery } from '../api/socioApi'

export function useSocios(params?: SociosQuery) {
  return useQuery({
    queryKey: ['socios', params],
    queryFn: () => socioApi.list(params),
  })
}

export function useSocio(id: number) {
  return useQuery({
    queryKey: ['socio', id],
    queryFn: () => socioApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateSocio() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (formData: FormData) => socioApi.create(formData),
    onSuccess: (res) => {
      toast.success(res.message || 'Socio registrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['socios'] })
      navigate(`/socios/${res.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar socio')
    },
  })
}

export function useUpdateSocio(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (formData: FormData) => socioApi.update(id, formData),
    onSuccess: (res) => {
      toast.success(res.message || 'Socio actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['socios'] })
      queryClient.invalidateQueries({ queryKey: ['socio', id] })
      navigate(`/socios/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar socio')
    },
  })
}

export function useDeleteSocio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => socioApi.delete(id),
    onSuccess: () => {
      toast.success('Socio eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['socios'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar socio')
    },
  })
}
