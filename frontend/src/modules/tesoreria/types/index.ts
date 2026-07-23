export interface FlujoCajaGrupo {
  grupo: string
  ingresos: number
  egresos: number
  neto: number
  movimientos: number
  detalle: FlujoCajaDetalle[]
}

export interface FlujoCajaDetalle {
  id: number
  codigo: string
  tipo: string
  monto: number
  descripcion?: string
  fechaMovimiento: string
  estado: string
  caja?: { codigo: string; nombre: string }
  concepto?: { id: number; codigo: string; nombre: string; tipo: string; afectaSaldo: string }
}

export interface FlujoCajaParams {
  cajaId?: number
  fechaInicio: string
  fechaFin: string
  agruparPor?: 'DIA' | 'SEMANA' | 'MES' | 'CONCEPTO'
  tipo?: 'TODOS' | 'INGRESO' | 'EGRESO'
}

export interface ResumenDashboard {
  resumen: {
    totalCajas: number
    totalSaldo: number
    arqueosPendientes: number
    flujoProximos: number
    hoy: { ingresos: number; egresos: number; neto: number; movimientos: number }
  }
  cajas: Array<{
    id: number; codigo: string; nombre: string; saldoActual: number; tipo: string; moneda: string
    periodo: { ingresos: number; egresos: number; neto: number; movimientos: number }
  }>
  movimientosHoy: any[]
  arqueosPendientes: any[]
  flujoProximos: any[]
}

export interface TransferenciaInput {
  cajaOrigenId: number
  cajaDestinoId: number
  monto: number
  concepto: string
  descripcion?: string
  comprobante?: string
}

export interface ConciliacionInput {
  cajaId: number
  fechaInicio: string
  fechaFin: string
  saldoBanco: number
  movimientosBanco?: Array<{ fecha: string; concepto: string; monto: number; referencia?: string }>
}

export interface ProyeccionFlujo {
  cajaId: number
  periodo: { inicio: string; fin: string }
  flujoProyectado: any[]
  promediosHistoricos: Array<{
    concepto: string
    ingresos: number
    egresos: number
    count: number
    ingresoPromedio: number
    egresoPromedio: number
  }>
}

export interface ProyeccionParams {
  cajaId: number
  meses?: number
}
