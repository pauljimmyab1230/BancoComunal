export type TipoAporte = 'OBLIGATORIO' | 'EXTRAORDINARIO' | 'VOLUNTARIO' | 'MULTA'
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO'
export type EstadoAporte = 'ACTIVO' | 'ANULADO'

export interface Aporte {
  id: number
  tipo: TipoAporte
  monto: number
  periodo: string
  fechaAporte: string
  metodoPago: MetodoPago
  comprobante: string | null
  observacion: string | null
  estado: EstadoAporte
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
}

export interface AporteFormData {
  tipo: TipoAporte
  monto: number
  periodo: string
  fechaAporte?: string
  metodoPago: MetodoPago
  comprobante?: string
  observacion?: string
  fondoId: number
  socioId: number
}
