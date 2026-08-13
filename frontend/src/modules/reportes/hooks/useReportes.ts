import { useQuery } from '@tanstack/react-query'
import { reportesApi } from '../api/reportesApi'
import type { CarteraCreditosQuery, EstadoCuentasQuery, ReporteAportesQuery } from '../types'

export function useEstadoCuentasSocio(params?: EstadoCuentasQuery | null) {
  const enabled = !!params && (params.socioId !== undefined || !!params.search)
  return useQuery({
    queryKey: ['estadoCuentasSocio', params],
    queryFn: () => reportesApi.getEstadoCuentasSocio(params ?? undefined),
    enabled,
  })
}

export function useCarteraCreditos(params?: CarteraCreditosQuery) {
  return useQuery({
    queryKey: ['carteraCreditos', params],
    queryFn: () => reportesApi.getCarteraCreditos(params),
  })
}

export function useEstadoResultados(params: { fondoId?: number; fechaInicio: string; fechaFin: string } | null) {
  return useQuery({
    queryKey: ['estadoResultados', params],
    queryFn: () => reportesApi.getEstadoResultados(params!),
    enabled: !!params?.fechaInicio && !!params?.fechaFin,
  })
}

export function useReporteAportes(params?: ReporteAportesQuery) {
  return useQuery({
    queryKey: ['reporteAportes', params],
    queryFn: () => reportesApi.getReporteAportes(params),
  })
}

export function useMorosos(params?: { fondoId?: number; diasMinimos?: number }) {
  return useQuery({
    queryKey: ['morosos', params],
    queryFn: () => reportesApi.getMorosos(params),
  })
}

export function useResumenEjecutivo() {
  return useQuery({
    queryKey: ['resumenEjecutivo'],
    queryFn: () => reportesApi.getResumenEjecutivo(),
  })
}

export function useFlujoCaja(params: { cajaId?: number; fechaInicio: string; fechaFin: string } | null) {
  return useQuery({
    queryKey: ['flujoCaja', params],
    queryFn: () => reportesApi.getFlujoCaja(params!),
    enabled: !!params?.fechaInicio && !!params?.fechaFin,
  })
}

export function useBalanceGeneral(params?: { fondoId?: number }) {
  return useQuery({
    queryKey: ['balanceGeneral', params],
    queryFn: () => reportesApi.getBalanceGeneral(params),
  })
}

export function useAntiguedadCartera(params?: { fondoId?: number }) {
  return useQuery({
    queryKey: ['antiguedadCartera', params],
    queryFn: () => reportesApi.getAntiguedadCartera(params),
  })
}

export function useLibroDiario(params: { cajaId?: number; fechaInicio: string; fechaFin: string; limit?: number } | null) {
  return useQuery({
    queryKey: ['libroDiario', params],
    queryFn: () => reportesApi.getLibroDiario(params!),
    enabled: !!params?.fechaInicio && !!params?.fechaFin,
  })
}

export function useReporteArqueos(params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string; limit?: number }) {
  return useQuery({
    queryKey: ['reporteArqueos', params],
    queryFn: () => reportesApi.getReporteArqueos(params),
  })
}

export function useMovimientosCaja(params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string; tipo?: string; limit?: number }) {
  return useQuery({
    queryKey: ['movimientosCaja', params],
    queryFn: () => reportesApi.getMovimientosCaja(params),
  })
}
