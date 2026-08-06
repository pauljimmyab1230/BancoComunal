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
