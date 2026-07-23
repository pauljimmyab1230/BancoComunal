export interface EstadoCuentasSocio {
  socio: {
    id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno?: string
    telefono?: string; email?: string; fechaIngreso: string; estado: string
  }
  beneficiarios: Array<{ id: number; nombres: string; parentesco: string }>
  resumen: { totalAhorros: number; totalAportes: number; totalPrestamos: number; totalCuotasPendientes: number; totalDeuda: number; prestamosActivos: number }
  cuentasAhorro: Array<{ id: number; saldo: number; fondo: { id: number; nombre: string }; movimientos: any[] }>
  aportes: Array<{ id: number; monto: number; tipo: string; periodo: string; fechaAporte: string; metodoPago: string; fondo: { id: number; nombre: string } }>
  prestamos: Array<{ id: number; monto: number; tasaInteres: number; numeroCuotas: number; montoCuota: number; totalInteres: number; fechaDesembolso: string; estado: string; fondo: { id: number; nombre: string }; cuotas: any[] }>
}

export interface CarteraCreditoResumen {
  totalPrestamos: number; prestamosActivos: number; prestamosPagados: number
  montoTotal: number; saldoTotal: number; cuotasVencidas: number; tasaMorosidad: number
}

export interface CarteraCreditoPrestamo {
  id: number; socio: { id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; telefono?: string }
  fondo: { id: number; nombre: string }; monto: number; tasaInteres: number; numeroCuotas: number
  montoCuota: number; totalInteres: number; fechaDesembolso: string; estado: string
  cuotasPagadas: number; cuotasVencidas: number; cuotasPendientes: number
  totalPagado: number; saldoPendiente: number; diasAtraso: number
}

export interface EstadoResultadosFondo {
  fondo: { id: number; nombre: string; capitalInicial: number; capitalDisponible: number; moneda: string }
  ingresos: { intereses: number; aportes: number; total: number }
  egresos: { retiros: number; total: number }
  resultadoNeto: number
  detalle: { cuotasPagadas: number; aportes: number; retiros: number }
}

export interface ReporteAporte {
  id: number; monto: number; tipo: string; periodo: string; fechaAporte: string; metodoPago: string; estado: string
  socio: { id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno?: string }
  fondo: { id: number; nombre: string }
}

export interface Moroso {
  socio: { id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; telefono?: string; email?: string }
  prestamo: { id: number; monto: number; montoCuota: number; numeroCuotas: number; fechaDesembolso: string }
  fondo: { id: number; nombre: string }
  cuotasAtrasadas: number; montoAdeudado: number; diasMaxAtraso: number
  cuotas: Array<{ numero: number; fechaVencimiento: string; monto: number; saldoPendiente: number; estado: string }>
}

export interface ResumenEjecutivo {
  socios: { total: number; activos: number; inactivos: number }
  fondos: { total: number; activos: number }
  creditos: { activos: number; capitalPrestado: number; capitalRecuperado: number; saldoPendiente: number; cuotasVencidas: number; tasaMorosidad: number }
  ahorros: { total: number; cuentas: number }
  aportes: { mesActual: number; cantidad: number }
  cajas: Array<{ codigo: string; nombre: string; saldoActual: number }>
  totalSaldoCajas: number
  cuotasPorVencer: number
  cuotasPorVencerDetalle: Array<{ socio: string; telefono?: string; monto: number; fechaVencimiento: string }>
}
