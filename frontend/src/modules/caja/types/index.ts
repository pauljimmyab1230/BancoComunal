export interface Caja {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  tipo: 'PRINCIPAL' | 'SECUNDARIA' | 'CAJA_CHICA'
  moneda: string
  saldoInicial: number
  saldoActual: number
  responsableId: number
  estado: 'ACTIVA' | 'INACTIVA' | 'CERRADA'
  createdAt: string
  updatedAt: string
  responsable?: {
    id: number
    nombres: string
    apellidoPaterno: string
    apellidoMaterno?: string
  }
  _count?: {
    movimientos: number
    arqueos: number
  }
}

export interface ConceptoCaja {
  id: number
  codigo: string
  nombre: string
  tipo: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE'
  afectaSaldo: 'AUMENTA' | 'DISMINUYE' | 'NO_AFECTA'
  descripcion?: string
  requiereComprobante: boolean
  orden: number
  estado: 'ACTIVO' | 'INACTIVO'
}

export interface MovimientoCaja {
  id: number
  codigo: string
  tipo: 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE'
  monto: number
  descripcion?: string
  comprobante?: string
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'OTRO'
  referencia?: string
  fechaMovimiento: string
  estado: 'REGISTRADO' | 'ANULADO' | 'PENDIENTE' | 'CONFIRMADO'
  createdAt: string
  updatedAt: string
  cajaId: number
  conceptoId: number
  registradorId: number
  arqueoId?: number
  caja?: {
    id: number
    codigo: string
    nombre: string
  }
  concepto?: ConceptoCaja
  registrador?: {
    id: number
    nombres: string
    apellidoPaterno: string
    apellidoMaterno?: string
  }
  arqueo?: {
    id: number
    codigo: string
  }
}

export interface ArqueoCaja {
  id: number
  codigo: string
  fechaArqueo: string
  saldoSistema: number
  saldoFisico: number
  diferencia: number
  observacion?: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CERRADO'
  createdAt: string
  updatedAt: string
  cajaId: number
  responsableId: number
  aprobadorId?: number
  fechaAprobacion?: string
  caja?: {
    id: number
    codigo: string
    nombre: string
  }
  responsable?: {
    id: number
    nombres: string
    apellidoPaterno: string
  }
  aprobador?: {
    id: number
    nombres: string
    apellidoPaterno: string
  }
  movimientos?: MovimientoCaja[]
  _count?: {
    movimientos: number
  }
}

export interface FlujoCajaProyectado {
  id: number
  fecha: string
  tipo: 'INGRESO' | 'EGRESO' | 'INGRESO_PROYECTADO' | 'EGRESO_PROYECTADO'
  concepto: string
  montoProyectado: number
  montoReal?: number
  descripcion?: string
  estado: 'PROYECTADO' | 'CONFIRMADO' | 'ANULADO'
  createdAt: string
  updatedAt: string
  cajaId: number
  caja?: {
    id: number
    codigo: string
    nombre: string
  }
}

export interface ResumenCaja {
  caja: {
    id: number
    codigo: string
    nombre: string
    saldoActual: number
    estado: string
  }
  hoy: {
    movimientos: number
    ingresos: number
    egresos: number
    neto: number
  }
  arqueosPendientes: number
  flujoProximos: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  estado?: string
  tipo?: string
  cajaId?: number
  fechaInicio?: string
  fechaFin?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface CreateCajaInput {
  nombre: string
  descripcion?: string
  tipo?: string
  moneda?: string
  saldoInicial?: number
  responsableId: number
  estado?: string
}

export interface UpdateCajaInput extends Partial<CreateCajaInput> {}

export interface CreateMovimientoInput {
  cajaId: number
  conceptoId: number
  tipo: string
  monto: number
  descripcion?: string
  comprobante?: string
  metodoPago?: string
  referencia?: string
  fechaMovimiento?: string
}

export interface CreateArqueoInput {
  cajaId: number
  saldoFisico: number
  fechaArqueo?: string
  observacion?: string
}

export interface AprobarArqueoInput {
  estado: 'APROBADO' | 'RECHAZADO'
  observacion?: string
  aprobadorId: number
}

export interface CreateFlujoProyectadoInput {
  cajaId: number
  fecha: string
  tipo: string
  concepto: string
  montoProyectado: number
  montoReal?: number
  descripcion?: string
}

export interface ResumenDashboard {
  resumen: {
    totalCajas: number
    totalSaldo: number
    arqueosPendientes: number
    flujoProximos: number
    hoy: {
      ingresos: number
      egresos: number
      neto: number
      movimientos: number
    }
  }
  cajas: Array<{
    id: number
    codigo: string
    nombre: string
    saldoActual: number
    tipo: string
    moneda: string
    periodo: {
      ingresos: number
      egresos: number
      neto: number
      movimientos: number
    }
  }>
  movimientosHoy: MovimientoCaja[]
  arqueosPendientes: ArqueoCaja[]
  flujoProximos: FlujoCajaProyectado[]
}