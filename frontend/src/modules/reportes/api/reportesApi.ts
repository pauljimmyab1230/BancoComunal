import api from '@/lib/api'
import type { EstadoCuentasSocio, CarteraCreditoResumen, CarteraCreditoPrestamo, EstadoResultadosFondo, ReporteAporte, Moroso, ResumenEjecutivo } from '../types'

export const reportesApi = {
  getEstadoCuentasSocio: async (socioId: number, fondoId?: number): Promise<EstadoCuentasSocio> => {
    const params: any = { socioId }
    if (fondoId) params.fondoId = fondoId
    const { data } = await api.get('/reportes/estado-cuentas-socio', { params })
    return data.data
  },

  getCarteraCreditos: async (params?: { fondoId?: number; estado?: string; fechaInicio?: string; fechaFin?: string }): Promise<{ resumen: CarteraCreditoResumen; prestamos: CarteraCreditoPrestamo[] }> => {
    const { data } = await api.get('/reportes/cartera-creditos', { params })
    return data.data
  },

  getEstadoResultados: async (params: { fondoId?: number; fechaInicio: string; fechaFin: string }): Promise<{ fondos: EstadoResultadosFondo[]; totales: { ingresos: number; egresos: number; neto: number }; periodo: { inicio: string; fin: string } }> => {
    const { data } = await api.get('/reportes/estado-resultados', { params })
    return data.data
  },

  getReporteAportes: async (params?: { fondoId?: number; periodo?: string; tipo?: string }): Promise<{ aportes: ReporteAporte[]; resumen: any }> => {
    const { data } = await api.get('/reportes/aportes', { params })
    return data.data
  },

  getMorosos: async (params?: { fondoId?: number; diasMinimos?: number }): Promise<{ morosos: Moroso[]; resumen: { totalMorosos: number; montoTotalAdeudado: number; cuotasVencidasTotal: number } }> => {
    const { data } = await api.get('/reportes/morosos', { params })
    return data.data
  },

  getResumenEjecutivo: async (): Promise<ResumenEjecutivo> => {
    const { data } = await api.get('/reportes/resumen-ejecutivo')
    return data.data
  },
}
