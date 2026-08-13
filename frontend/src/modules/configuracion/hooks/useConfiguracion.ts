import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { configuracionApi } from '../api/configuracionApi'
import type { PaginationParams } from '../types'

export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => configuracionApi.login(username, password),
    onError: (error: Error) => {
      toast.error(error.message || 'Error al iniciar sesión')
    },
  })
}

export function useUsuarios(params?: PaginationParams) {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => configuracionApi.listUsuarios(params),
  })
}

export function useUsuario(id: number) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: () => configuracionApi.getUsuarioById(id),
    enabled: !!id,
  })
}

export function useCreateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => configuracionApi.createUsuario(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Usuario creado')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear usuario')
    },
  })
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => configuracionApi.updateUsuario(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Usuario actualizado')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar usuario')
    },
  })
}

export function useUpdatePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => configuracionApi.updatePassword(id, password),
    onSuccess: (res) => {
      toast.success(res.message || 'Contraseña actualizada')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar contraseña')
    },
  })
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      configuracionApi.changeOwnPassword(currentPassword, newPassword),
    onSuccess: (res) => {
      toast.success(res.message || 'Contraseña actualizada correctamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar contraseña')
    },
  })
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => configuracionApi.deleteUsuario(id),
    onSuccess: () => {
      toast.success('Usuario eliminado')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar usuario')
    },
  })
}

export function useConceptos(params?: PaginationParams) {
  return useQuery({
    queryKey: ['conceptosCaja', params],
    queryFn: () => configuracionApi.listConceptos(params),
  })
}

export function useCreateConcepto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => configuracionApi.createConcepto(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Concepto creado')
      queryClient.invalidateQueries({ queryKey: ['conceptosCaja'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear concepto')
    },
  })
}

export function useUpdateConcepto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => configuracionApi.updateConcepto(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Concepto actualizado')
      queryClient.invalidateQueries({ queryKey: ['conceptosCaja'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar concepto')
    },
  })
}

export function useDeleteConcepto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => configuracionApi.deleteConcepto(id),
    onSuccess: () => {
      toast.success('Concepto eliminado')
      queryClient.invalidateQueries({ queryKey: ['conceptosCaja'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar concepto')
    },
  })
}

export function useOrganizacion() {
  return useQuery({
    queryKey: ['organizacion'],
    queryFn: () => configuracionApi.getOrganizacion(),
  })
}

export function useUpdateOrganizacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => configuracionApi.updateOrganizacion(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Organización actualizada')
      queryClient.invalidateQueries({ queryKey: ['organizacion'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar organización')
    },
  })
}
