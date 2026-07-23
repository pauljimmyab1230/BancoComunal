export interface DashboardResumen {
  totalSocios: number
  sociosActivos: number
  totalFondos: number
  fondosActivos: number
  creditosActivos: number
  capitalPrestado: number
  capitalRecuperado: number
  saldoPendienteCartera: number
  cuotasVencidas: number
  totalAhorros: number
  totalSaldoCajas: number
  aportesMes: number
  aportesSemana: number
  cantidadAportesMes: number
  aportesPorTipo: Record<string, number>
}

export interface DashboardCaja {
  id: number
  codigo: string
  nombre: string
  saldoActual: number
  tipo: string
  moneda: string
}

export interface DashboardMovimiento {
  id: number
  codigo: string
  tipo: string
  monto: number
  fechaMovimiento: string
  caja: { nombre: string }
  concepto: { nombre: string }
  registrador: { nombres: string; apellidoPaterno: string }
}

export interface DashboardCuotaProxima {
  socio: string
  telefono?: string
  fondo: string
  monto: number
  saldoPendiente: number
  fechaVencimiento: string
}

export interface DashboardArqueoPendiente {
  id: number
  codigo: string
  fechaArqueo: string
  saldoSistema: number
  saldoFisico: number
  diferencia: number
  caja: { nombre: string }
  responsable: { nombres: string; apellidoPaterno: string }
}

export interface DashboardPrestamoTop {
  id: number
  socio: { id: number; codigo: string; nombres: string; apellidoPaterno: string }
  fondo: { id: number; nombre: string }
  monto: number
  totalPagado: number
  saldoPendiente: number
  cuotasPagadas: number
  totalCuotas: number
}

export interface DashboardAuditEntry {
  id: number
  tabla: string
  registroId: number
  operacion: string
  createdAt: string
  usuario: { id: number; nombres: string; apellidoPaterno: string; username: string }
}

export interface DashboardData {
  resumen: DashboardResumen
  cajas: DashboardCaja[]
  movimientosHoy: DashboardMovimiento[]
  cuotasProximas: DashboardCuotaProxima[]
  arqueosPendientes: DashboardArqueoPendiente[]
  prestamosTop5: DashboardPrestamoTop[]
  actividadReciente: DashboardAuditEntry[]
}
