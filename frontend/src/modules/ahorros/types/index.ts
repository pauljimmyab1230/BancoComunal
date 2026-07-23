export interface CuentaAhorro {
  id: number
  saldo: number
  estado: string
  createdAt: string
  updatedAt: string
  socioId: number
  fondoId: number
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
  totalMovimientos?: number
  movimientos?: AhorroMovimiento[]
  movimientosTotal?: number
  movimientosPage?: number
  movimientosTotalPages?: number
}

export interface AhorroMovimiento {
  id: number
  tipo: 'DEPOSITO' | 'RETIRO'
  monto: number
  saldoAntes: number
  saldoDespues: number
  metodoPago: string
  comprobante: string | null
  observacion: string | null
  createdAt: string
  cuentaId: number
  registradorId: number
  registrador?: {
    id: number
    nombres: string
    apellidoPaterno: string
  }
  cuenta?: {
    socio: { id: number; codigo: string; nombres: string; apellidoPaterno: string }
    fondo: { id: number; nombre: string; moneda: string }
  }
}

export interface CrearCuentaForm {
  fondoId: number
  socioId: number
}

export interface CrearMovimientoForm {
  tipo: 'DEPOSITO' | 'RETIRO'
  monto: number
  metodoPago: string
  comprobante?: string
  observacion?: string
  cuentaId: number
}
