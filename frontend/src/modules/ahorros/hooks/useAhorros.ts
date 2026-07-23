import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ahorrosApi, type CuentasQuery } from '../api/ahorrosApi'

export function useCuentasAhorro(params?: CuentasQuery) {
  return useQuery({
    queryKey: ['cuentas-ahorro', params],
    queryFn: () => ahorrosApi.listCuentas(params),
  })
}

export function useCuentaAhorro(id: number, movPage?: number) {
  return useQuery({
    queryKey: ['cuenta-ahorro', id, movPage],
    queryFn: () => ahorrosApi.getCuenta(id, movPage, 20),
    enabled: !!id,
  })
}

export function useCrearCuentaAhorro() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => ahorrosApi.crearCuenta(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Cuenta de ahorro creada')
      queryClient.invalidateQueries({ queryKey: ['cuentas-ahorro'] })
      navigate(`/ahorros/${res.data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear cuenta')
    },
  })
}

export function useActualizarEstadoCuenta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) => ahorrosApi.actualizarEstado(id, estado),
    onSuccess: (res) => {
      toast.success(res.message || 'Estado actualizado')
      queryClient.invalidateQueries({ queryKey: ['cuentas-ahorro'] })
      queryClient.invalidateQueries({ queryKey: ['cuenta-ahorro'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar estado')
    },
  })
}

export function useCrearMovimiento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => ahorrosApi.crearMovimiento(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Movimiento registrado')
      queryClient.invalidateQueries({ queryKey: ['cuenta-ahorro'] })
      queryClient.invalidateQueries({ queryKey: ['cuentas-ahorro'] })
      queryClient.invalidateQueries({ queryKey: ['fondos'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar movimiento')
    },
  })
}

export function useMovimientosAhorro(params?: { page?: number; limit?: number; cuentaId?: number }) {
  return useQuery({
    queryKey: ['movimientos-ahorro', params],
    queryFn: () => ahorrosApi.listMovimientos(params),
  })
}
