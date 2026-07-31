export interface Prestamo {
  id: number
  monto: number
  tasaInteres: number
  numeroCuotas: number
  montoCuota: number
  totalInteres: number
  fechaDesembolso: string
  fechaPrimerVencimiento: string
  estado: 'ACTIVO' | 'PAGADO' | 'ANULADO' | 'PENDIENTE'
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
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL' | 'ANULADO'
  metodoPago: string | null
  comprobante: string | null
  prestamoId: number
}

export interface PrestamoFormData {
  monto: number
  tasaInteres: number
  numeroCuotas: number
  fechaPrimerVencimiento: string
  fondoId: number
  socioId: number
}

export interface PagoCuotaForm {
  cuotaId: number
  monto: number
  fechaPago?: string
  metodoPago: string
  comprobante?: string
}
