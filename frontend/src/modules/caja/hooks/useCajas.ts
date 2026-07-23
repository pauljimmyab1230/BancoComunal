import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { cajaApi } from '../api/cajaApi'
import type { PaginationParams, CreateCajaInput, UpdateCajaInput, CreateMovimientoInput, CreateArqueoInput, AprobarArqueoInput, CreateFlujoProyectadoInput } from '../types'

export function useCajas(params?: PaginationParams) {
  return useQuery({
    queryKey: ['cajas', params],
    queryFn: () => cajaApi.list(params),
  })
}

export function useCaja(id: number) {
  return useQuery({
    queryKey: ['caja', id],
    queryFn: () => cajaApi.getById(id),
    enabled: !!id,
  })
}

export function useCajaResumen(id: number) {
  return useQuery({
    queryKey: ['cajaResumen', id],
    queryFn: () => cajaApi.getResumen(id),
    enabled: !!id,
  })
}

export function useConceptos(params?: { estado?: string; tipo?: string }) {
  return useQuery({
    queryKey: ['conceptosCaja', params],
    queryFn: () => cajaApi.listConceptos(params),
  })
}

export function useCreateCaja() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CreateCajaInput) => cajaApi.create(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Caja creada correctamente')
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
      navigate('/caja')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear caja')
    },
  })
}

export function useUpdateCaja(id: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: UpdateCajaInput) => cajaApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Caja actualizada correctamente')
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
      queryClient.invalidateQueries({ queryKey: ['caja', id] })
      navigate(`/caja/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar caja')
    },
  })
}

export function useDeleteCaja() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cajaApi.delete(id),
    onSuccess: () => {
      toast.success('Caja eliminada correctamente')
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar caja')
    },
  })
}

export function useCreateConcepto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => cajaApi.createConcepto(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Concepto creado correctamente')
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
    mutationFn: ({ id, data }: { id: number; data: any }) => cajaApi.updateConcepto(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Concepto actualizado correctamente')
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
    mutationFn: (id: number) => cajaApi.deleteConcepto(id),
    onSuccess: () => {
      toast.success('Concepto eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['conceptosCaja'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar concepto')
    },
  })
}

export function useMovimientos(params?: PaginationParams) {
  return useQuery({
    queryKey: ['movimientosCaja', params],
    queryFn: () => cajaApi.listMovimientos(params),
  })
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMovimientoInput) => cajaApi.createMovimiento(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Movimiento registrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['movimientosCaja'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar movimiento')
    },
  })
}

export function useAnularMovimiento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cajaApi.anularMovimiento(id),
    onSuccess: () => {
      toast.success('Movimiento anulado correctamente')
      queryClient.invalidateQueries({ queryKey: ['movimientosCaja'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anular movimiento')
    },
  })
}

export function useArqueos(params?: PaginationParams) {
  return useQuery({
    queryKey: ['arqueosCaja', params],
    queryFn: () => cajaApi.listArqueos(params),
  })
}

export function useArqueo(id: number) {
  return useQuery({
    queryKey: ['arqueo', id],
    queryFn: () => cajaApi.getArqueoById(id),
    enabled: !!id,
  })
}

export function useCreateArqueo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateArqueoInput) => cajaApi.createArqueo(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Arqueo registrado correctamente')
      queryClient.invalidateQueries({ queryKey: ['arqueosCaja'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar arqueo')
    },
  })
}

export function useAprobarArqueo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AprobarArqueoInput }) => cajaApi.aprobarArqueo(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Arqueo procesado correctamente')
      queryClient.invalidateQueries({ queryKey: ['arqueosCaja'] })
      queryClient.invalidateQueries({ queryKey: ['arqueo'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar arqueo')
    },
  })
}

export function useFlujoProyectado(params?: { cajaId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }) {
  return useQuery({
    queryKey: ['flujoProyectado', params],
    queryFn: () => cajaApi.listFlujoProyectado(params),
  })
}

export function useCreateFlujoProyectado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFlujoProyectadoInput) => cajaApi.createFlujoProyectado(data),
    onSuccess: () => {
      toast.success('Flujo proyectado creado correctamente')
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear flujo proyectado')
    },
  })
}

export function useUpdateFlujoProyectado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFlujoProyectadoInput> }) => cajaApi.updateFlujoProyectado(id, data),
    onSuccess: () => {
      toast.success('Flujo proyectado actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar flujo proyectado')
    },
  })
}

export function useDeleteFlujoProyectado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cajaApi.deleteFlujoProyectado(id),
    onSuccess: () => {
      toast.success('Flujo proyectado eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['flujoProyectado'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar flujo proyectado')
    },
  })
}