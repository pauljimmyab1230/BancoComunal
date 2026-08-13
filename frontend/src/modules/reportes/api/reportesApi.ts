import api from '@/lib/api'
import type { EstadoCuentasSocio, CarteraCreditoResumen, CarteraCreditoPrestamo, EstadoResultadosFondo, ReporteAporte, Moroso, ResumenEjecutivo, CarteraCreditosQuery, ReporteAportesQuery, EstadoCuentasQuery, ReporteAportesResumen } from '../types'

export const reportesApi = {
  getEstadoCuentasSocio: async (params?: EstadoCuentasQuery): Promise<EstadoCuentasSocio> => {
    const { data } = await api.get('/reportes/estado-cuentas-socio', { params })
    return data.data
  },

  getCarteraCreditos: async (params?: CarteraCreditosQuery): Promise<{ resumen: CarteraCreditoResumen; prestamos: CarteraCreditoPrestamo[] }> => {
    const { data } = await api.get('/reportes/cartera-creditos', { params })
    return data.data
  },

  getEstadoResultados: async (params: { fondoId?: number; fechaInicio: string; fechaFin: string }): Promise<{ fondos: EstadoResultadosFondo[]; totales: { ingresos: number; egresos: number; neto: number }; totalesPorMoneda: Record<string, number>; periodo: { inicio: string; fin: string } }> => {
    const { data } = await api.get('/reportes/estado-resultados', { params })
    return data.data
  },

  getReporteAportes: async (params?: ReporteAportesQuery): Promise<{ aportes: ReporteAporte[]; resumen: ReporteAportesResumen }> => {
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

  getFlujoCaja: async (params: { cajaId?: number; fechaInicio: string; fechaFin: string }): Promise<import('../types').FlujoCajaData> => {
    const { data } = await api.get('/reportes/flujo-caja', { params })
    return data.data
  },

  getBalanceGeneral: async (params?: { fondoId?: number }): Promise<import('../types').BalanceGeneralData> => {
    const { data } = await api.get('/reportes/balance-general', { params })
    return data.data
  },

  getAntiguedadCartera: async (params?: { fondoId?: number }): Promise<import('../types').AntiguedadCarteraData> => {
    const { data } = await api.get('/reportes/antiguedad-cartera', { params })
    return data.data
  },

  getLibroDiario: async (params: { cajaId?: number; fechaInicio: string; fechaFin: string; limit?: number }): Promise<import('../types').LibroDiarioData> => {
    const { data } = await api.get('/reportes/libro-diario', { params })
    return data.data
  },

  getReporteArqueos: async (params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string; limit?: number }): Promise<import('../types').ReporteArqueosData> => {
    const { data } = await api.get('/reportes/reporte-arqueos', { params })
    return data.data
  },

  getMovimientosCaja: async (params?: { cajaId?: number; fechaInicio?: string; fechaFin?: string; tipo?: string; limit?: number }): Promise<import('../types').MovimientosCajaData> => {
    const { data } = await api.get('/reportes/movimientos-caja', { params })
    return data.data
  },
}
