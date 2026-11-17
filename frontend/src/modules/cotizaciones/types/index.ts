import type { PaginatedResponse } from '@/types'

export type EstadoCotizacion = 'BORRADOR' | 'APROBADA' | 'RECHAZADA' | 'CONVERTIDA'

export interface CotizacionSocio {
  id: number
  codigo: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  dni: string
}

export interface CotizacionFondo {
  id: number
  nombre: string
  moneda: string
}

export interface Cotizacion {
  id: number
  codigo: string
  monto: number
  tasaInteres: number
  numeroCuotas: number
  fechaPrimerVencimiento: string
  montoCuota: number
  totalInteres: number
  estado: EstadoCotizacion
  observacion: string | null
  fechaCotizacion: string
  fondoId: number | null
  socioId: number | null
  prestamoId: number | null
  createdAt: string
  updatedAt: string
  fondo: CotizacionFondo | null
  socio: CotizacionSocio | null
}

export interface CotizacionFormData {
  monto: number
  tasaInteres: number
  numeroCuotas: number
  fechaPrimerVencimiento: string
  fondoId?: number | null
  socioId?: number | null
  observacion?: string
}

export type CotizacionesListResponse = PaginatedResponse<Cotizacion> & {
  resumenEstados: Record<string, number>
}
