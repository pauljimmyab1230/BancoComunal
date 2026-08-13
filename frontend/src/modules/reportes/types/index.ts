export interface EstadoCuentaCuota {
  id: number; numero: number; fechaVencimiento: string; fechaPago?: string
  monto: number; interes: number; amortizacion: number; saldo: number
  montoPagado: number; saldoPendiente: number; estado: string; metodoPago?: string; comprobante?: string
}

export interface EstadoCuentasSocio {
  socio: {
    id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno?: string
    telefono?: string; email?: string; fechaIngreso: string; estado: string
  }
  beneficiarios: Array<{ id: number; nombres: string; parentesco: string }>
  resumen: { totalAportes: number; totalPrestamos: number; totalCuotasPendientes: number; totalDeuda: number; prestamosActivos: number }
  aportes: Array<{ id: number; monto: number; tipo: string; periodo: string; fechaAporte: string; metodoPago: string; fondo: { id: number; nombre: string } }>
  prestamos: Array<{ id: number; monto: number; tasaInteres: number; numeroCuotas: number; montoCuota: number; totalInteres: number; fechaDesembolso: string; estado: string; fondo: { id: number; nombre: string }; cuotas: EstadoCuentaCuota[] }>
}

export interface CarteraCreditoResumen {
  totalPrestamos: number; prestamosActivos: number; prestamosPagados: number
  montoTotal: number; saldoTotal: number; cuotasVencidas: number; tasaMorosidad: number
}

export interface CarteraCreditoPrestamo {
  id: number; socio: { id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; telefono?: string }
  fondo: { id: number; nombre: string }; moneda?: string; monto: number; tasaInteres: number; numeroCuotas: number
  montoCuota: number; totalInteres: number; fechaDesembolso: string; estado: string
  cuotasPagadas: number; cuotasVencidas: number; cuotasPendientes: number
  totalPagado: number; saldoPendiente: number; diasAtraso: number
}

export interface EstadoResultadosFondo {
  fondo: { id: number; nombre: string; capitalInicial: number; capitalDisponible: number; moneda: string }
  ingresos: { cuotas: number; intereses: number; reintegros: number; otros: number; total: number }
  egresos: { desembolsos: number; gastos: number; faltantes: number; total: number }
  resultadoNeto: number
}

export interface ReporteAporte {
  id: number; monto: number; tipo: string; periodo: string; fechaAporte: string; metodoPago: string; estado: string
  socio: { id: number; codigo: string; dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno?: string }
  fondo: { id: number; nombre: string }
}

export interface ReporteAportesResumen {
  totalAportes: number
  montoTotal: number
  porTipo: { obligatorio: number; extraordinario: number; voluntario: number; multa: number }
  porMetodo: Record<string, number>
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
  aportes: { mesActual: number; cantidad: number }
  cajas: Array<{ codigo: string; nombre: string; saldoActual: number; moneda?: string }>
  totalSaldoCajas: number
  totalSaldoCajasPorMoneda: Record<string, number>
  cuotasPorVencer: number
  cuotasPorVencerDetalle: Array<{ socio: string; telefono?: string; monto: number; fechaVencimiento: string }>
}

export interface CarteraCreditosQuery {
  fondoId?: number
  estado?: 'ACTIVO' | 'PAGADO' | 'ANULADO' | 'TODOS'
  fechaInicio?: string
  fechaFin?: string
  limit?: number
}

export interface ReporteAportesQuery {
  fondoId?: number
  periodo?: string
  tipo?: 'OBLIGATORIO' | 'EXTRAORDINARIO' | 'VOLUNTARIO' | 'MULTA' | 'TODOS'
  limit?: number
}

export interface EstadoCuentasQuery {
  socioId?: number
  search?: string
  fondoId?: number
}

export interface FlujoCajaMovimiento {
  id: number
  fecha: string
  codigo: string
  concepto: string
  tipo: string
  monto: number
  caja: string
  metodoPago: string
  comprobante?: string
  estado: string
  descripcion?: string
}

export interface FlujoCajaData {
  movimientos: FlujoCajaMovimiento[]
  resumen: { totalIngresos: number; totalEgresos: number; flujoNeto: number }
  porCaja: Array<{ caja: string; ingresos: number; egresos: number; saldo: number }>
}

export interface BalanceGeneralData {
  activos: { cajas: number; cartera: number; total: number }
  patrimonio: {
    capitalInicial: number
    aportes: number
    interesGanado: number
    gastosOperativos: number
    resultadoEjercicio: number
    total: number
  }
}

export interface AntiguedadRango {
  rango: string
  cantidad: number
  monto: number
}

export interface AntiguedadCarteraData {
  rangos: AntiguedadRango[]
  total: { cantidad: number; monto: number }
}

export interface LibroDiarioAsiento {
  id: number
  fecha: string
  codigo: string
  concepto: string
  tipo: string
  monto: number
  caja: string
  comprobante?: string
}

export interface LibroDiarioData {
  asientos: LibroDiarioAsiento[]
  total: number
}

export interface ReporteArqueo {
  id: number
  codigo: string
  fecha: string
  caja: string
  saldoSistema: number
  saldoFisico: number
  diferencia: number
  estado: string
  aprobadoPor?: string
}

export interface ReporteArqueosData {
  arqueos: ReporteArqueo[]
  resumen: { total: number; aprobados: number; pendientes: number; conDiferencia: number }
}

export interface MovimientoCajaItem {
  id: number
  codigo: string
  fecha: string
  caja: string
  concepto: string
  tipo: string
  monto: number
  metodoPago: string
  comprobante?: string
  estado: string
  descripcion?: string
}

export interface MovimientosCajaData {
  movimientos: MovimientoCajaItem[]
  resumen: { total: number; ingresos: number; egresos: number; porConcepto: Array<{ concepto: string; monto: number }> }
}
