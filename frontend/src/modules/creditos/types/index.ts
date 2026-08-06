import type { PaginatedResponse } from '@/types'

export type EstadoPrestamo = 'ACTIVO' | 'PAGADO' | 'ANULADO'
export type EstadoCuota = 'PENDIENTE' | 'VENCIDO' | 'PAGADO' | 'PARCIAL' | 'ANULADO'

export interface Prestamo {
  id: number
  monto: number
  tasaInteres: number
  numeroCuotas: number
  montoCuota: number
  totalInteres: number
  fechaDesembolso: string
  fechaPrimerVencimiento: string
  estado: EstadoPrestamo
  createdAt: string
  updatedAt: string
  fondoId: number
  socioId: number
  socio: {
    id: number
    codigo: string
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    dni: string
  }
  fondo: {
    id: number
    nombre: string
    moneda: string
  }
  totalCuotas?: number
  cuotas?: CuotaPrestamo[]
}

export interface CuotaPrestamo {
  id: number
  numero: number
  fechaVencimiento: string
  monto: number
  interes: number
  amortizacion: number
  saldo: number
  montoPagado: number
  saldoPendiente: number
  fechaPago: string | null
  estado: EstadoCuota
  metodoPago: string | null
  comprobante: string | null
  prestamoId: number
}

export interface PrestamoFormData {
  monto: number
  tasaInteres: number
  numeroCuotas: number
  fechaPrimerVencimiento: string
  fondoId?: number
  socioId?: number
}

export interface PagoCuotaForm {
  cuotaId: number
  monto: number
  fechaPago?: string
  metodoPago: string
  comprobante?: string
}

export interface CreditosListResponse extends PaginatedResponse<Prestamo> {
  totalPrestado: number
  totalPrestadoPorMoneda: Record<string, number>
  totalActivos: number
}
