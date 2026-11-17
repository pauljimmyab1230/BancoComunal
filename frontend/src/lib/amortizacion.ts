export interface CuotaAmortizacion {
  numero: number
  fechaVencimiento: Date
  cuota: number
  interes: number
  amortizacion: number
  saldo: number
}

function round2(n: number): number {
  return Math.round((n + Math.sign(n || 1) * 1e-9) * 100) / 100
}

/**
 * Calcula la tabla de amortización francesa (cuota fija).
 * Replica exactamente la lógica del backend (`generarCuotas`) para que la
 * cotización coincida con el cronograma real del crédito.
 */
export function calcularAmortizacion(
  monto: number,
  tasaInteres: number,
  numeroCuotas: number,
  fechaPrimerVencimiento: Date
): CuotaAmortizacion[] {
  const i = tasaInteres / 100
  const n = numeroCuotas
  const montoCuota =
    i > 0 ? round2((monto * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)) : round2(monto / n)

  let saldoRestante = monto
  const cuotas: CuotaAmortizacion[] = []

  for (let idx = 1; idx <= n; idx++) {
    const fechaVenc = new Date(fechaPrimerVencimiento)
    fechaVenc.setMonth(fechaVenc.getMonth() + (idx - 1))

    const interes = round2(saldoRestante * i)
    const esUltima = idx === n
    const amortizacion = esUltima ? round2(saldoRestante) : round2(montoCuota - interes)
    const cuota = round2(amortizacion + interes)

    saldoRestante = round2(saldoRestante - amortizacion)

    cuotas.push({
      numero: idx,
      fechaVencimiento: fechaVenc,
      cuota,
      interes,
      amortizacion,
      saldo: Math.max(saldoRestante, 0),
    })
  }

  return cuotas
}

export interface ResumenAmortizacion {
  tabla: CuotaAmortizacion[]
  montoCuota: number
  totalInteres: number
  totalPagar: number
}

/** Devuelve la tabla completa más el resumen (cuota fija, interés total, total a pagar). */
export function resumenAmortizacion(
  monto: number,
  tasaInteres: number,
  numeroCuotas: number,
  fechaPrimerVencimiento: Date
): ResumenAmortizacion {
  const tabla = calcularAmortizacion(monto, tasaInteres, numeroCuotas, fechaPrimerVencimiento)
  const montoCuota = tabla[0]?.cuota ?? 0
  const totalInteres = round2(tabla.reduce((a, c) => a + c.interes, 0))
  const totalPagar = round2(monto + totalInteres)
  return { tabla, montoCuota, totalInteres, totalPagar }
}
