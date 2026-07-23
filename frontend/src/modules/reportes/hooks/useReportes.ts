import { useQuery } from '@tanstack/react-query'
import { reportesApi } from '../api/reportesApi'

export function useEstadoCuentasSocio(socioId: number | null, fondoId?: number) {
  return useQuery({
    queryKey: ['estadoCuentasSocio', socioId, fondoId],
    queryFn: () => reportesApi.getEstadoCuentasSocio(socioId!, fondoId),
    enabled: !!socioId,
  })
}

export function useCarteraCreditos(params?: { fondoId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }) {
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

export function useReporteAportes(params?: { fondoId?: number; periodo?: string; tipo?: string }) {
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
