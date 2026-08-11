export type CronogramaCuotaEstado = 'PAGADO' | 'PARCIAL' | 'VENCIDO' | 'PENDIENTE' | 'ANULADO'

export interface CronogramaCuotaRow {
  numero: number
  fechaVencimiento: string
  interes: string
  amortizacion: string
  cuota: string
  saldo: string
  pagado: string
  pendiente: string
  estado: CronogramaCuotaEstado
}

export interface CronogramaCuotasData {
  organizacion: string
  lema: string
  prestamoNumero: string
  socio: string
  dni: string
  fondo: string
  estadoPrestamo: string
  monto: string
  tasa: string
  numeroCuotas: number
  cuotaMensual: string
  totalInteres: string
  totalPagar: string
  fechaDesembolso: string
  fechaPrimerVencimiento: string
  fechaUltimaCuota: string
  filas: CronogramaCuotaRow[]
  totalAmortizacion: string
  totalCuota: string
  totalPagado: string
  totalPendiente: string
  observaciones: string
}

const css = `
:root {
  --navy: #0f172a;
  --navy-suave: #1e293b;
  --oro: #2563eb;
  --oro-claro: #3b82f6;
  --tinta: #111827;
  --tinta-suave: #6b7280;
  --papel: #ffffff;
  --linea: #e5e7eb;
  --linea-suave: #f3f4f6;
  --serif: Georgia, 'Times New Roman', serif;
  --sans: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--sans);
  color: var(--tinta);
  line-height: 1.5;
}

.hoja {
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: var(--papel);
  padding: 44px 52px 32px;
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 22px;
  border-bottom: 1px solid var(--linea);
  padding-bottom: 26px;
  margin-bottom: 26px;
}

.emblema-circulo {
  width: 62px;
  height: 62px;
  border: 1.5px solid var(--oro);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 35%, rgba(37, 99, 235, 0.12), transparent 70%);
}

.emblema-mono {
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--navy);
}

.membrete { flex: 1; }

.organizacion {
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--navy);
  text-transform: uppercase;
}

.lema {
  font-size: 11px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--tinta-suave);
  margin-top: 2px;
}

.membrete h1 {
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: var(--oro);
  margin-top: 10px;
}

.regla-oro {
  height: 2px;
  background: linear-gradient(90deg, var(--oro), var(--oro-claro), transparent);
  margin: 8px 0;
  width: 96px;
  border-radius: 2px;
}

.ficha-numero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 10px 18px;
  background: #fff;
}

.ficha-etiqueta {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.ficha-valor {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 1px;
}

.seccion-datos {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 18px;
}

.bloque-dato { display: flex; flex-direction: column; gap: 2px; }
.bloque-dato + .bloque-dato { border-left: 1px solid var(--linea-suave); padding-left: 20px; }

.bloque-dato .campo,
.bloque-condicion .campo,
.bloque-fecha .campo {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.bloque-dato .valor,
.bloque-condicion .valor,
.bloque-fecha .valor {
  font-size: 12px;
  font-weight: 600;
  color: var(--navy);
  text-transform: uppercase;
}

.seccion-condiciones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 20px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 12px;
  background: #f8fafc;
}

.bloque-condicion {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.seccion-fechas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 20px;
  border: 1px dashed var(--linea);
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 26px;
}

.bloque-fecha {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.seccion-tabla { margin-bottom: 26px; }

.encabezado-seccion {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.encabezado-seccion h2 {
  font-family: var(--serif);
  font-size: 16px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--navy);
}

.numeracion {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--oro);
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 13px;
  color: var(--oro);
  flex-shrink: 0;
}

.tabla-cronograma {
  width: 100%;
  border-collapse: collapse;
}

.tabla-cronograma th {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: left;
  color: var(--navy);
  padding: 8px 10px;
  border-bottom: 1.5px solid var(--navy);
}

.tabla-cronograma th:first-child { padding-left: 0; }
.tabla-cronograma th.der, .tabla-cronograma td.der { text-align: right; }

.tabla-cronograma td {
  font-size: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--linea-suave);
  color: var(--tinta);
  text-transform: uppercase;
}

.tabla-cronograma td:first-child { padding-left: 0; }
.tabla-cronograma tbody tr:nth-child(even) { background: #f8fafc; }

.tabla-cronograma .col-num {
  width: 34px;
  color: var(--oro);
  font-family: var(--serif);
  font-weight: 700;
}

.tabla-cronograma .fila-total td {
  border-top: 1.5px solid var(--navy);
  border-bottom: none;
  font-weight: 700;
  color: var(--navy);
  background: #eff6ff;
  padding: 10px;
  font-size: 12.5px;
}

.badge-estado {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
}

.badge-pagada { color: #166534; background: #dcfce7; }
.badge-parcial { color: #1e40af; background: #dbeafe; }
.badge-vencida { color: #991b1b; background: #fee2e2; }
.badge-pendiente { color: #b45309; background: #fef3c7; }
.badge-anulada { color: #374151; background: #e5e7eb; }

.seccion-notas { margin-bottom: 10px; }

.seccion-notas .campo {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.caja-notas {
  margin-top: 6px;
  border: 1px dashed var(--linea);
  border-radius: 8px;
  min-height: 60px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--tinta);
}

.seccion-firmas {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding: 0 40px;
  margin-top: 110px;
}

.bloque-firma { flex: 1; text-align: center; }
.bloque-firma .linea-firma { height: 4px; }

.linea-firma {
  border-top: 1px solid var(--tinta);
  height: 30px;
  width: 100%;
}

.nombre-firma {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--tinta);
  margin-top: 8px;
}

@page { size: A4; margin: 0; }

@media print {
  body { background: #ffffff; }
  .hoja { box-shadow: none; max-width: none; min-height: auto; padding: 8mm 12mm; }
  .seccion-tabla, .seccion-datos, .seccion-condiciones, .seccion-fechas { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const estadoBadge: Record<CronogramaCuotaEstado, { clase: string; texto: string }> = {
  PAGADO: { clase: 'badge-pagada', texto: 'Pagada' },
  PARCIAL: { clase: 'badge-parcial', texto: 'Parcial' },
  VENCIDO: { clase: 'badge-vencida', texto: 'Vencida' },
  PENDIENTE: { clase: 'badge-pendiente', texto: 'Pendiente' },
  ANULADO: { clase: 'badge-anulada', texto: 'Anulada' },
}

function filaCuota(row: CronogramaCuotaRow): string {
  const badge = estadoBadge[row.estado]
  return `
    <tr>
      <td class="col-num">${row.numero}</td>
      <td>${esc(row.fechaVencimiento)}</td>
      <td class="der">${esc(row.interes)}</td>
      <td class="der">${esc(row.amortizacion)}</td>
      <td class="der">${esc(row.cuota)}</td>
      <td class="der">${esc(row.saldo)}</td>
      <td class="der">${esc(row.pagado)}</td>
      <td class="der">${esc(row.pendiente)}</td>
      <td><span class="badge-estado ${badge.clase}">${badge.texto}</span></td>
    </tr>`
}

export function buildCronogramaCuotasHtml(data: CronogramaCuotasData): string {
  const filas = data.filas.map(filaCuota).join('\n')
  const notas = data.observaciones ? esc(data.observaciones) : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cronograma de Cuotas — Préstamo</title>
  <style>${css}</style>
</head>
<body>
  <div class="hoja">

    <header class="cabecera">
      <div class="emblema">
        <div class="emblema-circulo">
          <span class="emblema-mono">BC</span>
        </div>
      </div>

      <div class="membrete">
        <p class="organizacion">${esc(data.organizacion)}</p>
        <p class="lema">${esc(data.lema)}</p>
        <div class="regla-oro"></div>
        <h1>Cronograma de Cuotas</h1>
      </div>

      <div class="ficha-numero">
        <span class="ficha-etiqueta">Préstamo N°</span>
        <span class="ficha-valor">${esc(data.prestamoNumero)}</span>
      </div>
    </header>

    <section class="seccion-datos">
      <div class="bloque-dato">
        <span class="campo">Socio</span>
        <span class="valor">${esc(data.socio)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">DNI</span>
        <span class="valor">${esc(data.dni)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Fondo Rotatorio</span>
        <span class="valor">${esc(data.fondo)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Estado</span>
        <span class="valor">${esc(data.estadoPrestamo)}</span>
      </div>
    </section>

    <section class="seccion-condiciones">
      <div class="bloque-condicion">
        <span class="campo">Monto del Préstamo</span>
        <span class="valor">${esc(data.monto)}</span>
      </div>
      <div class="bloque-condicion">
        <span class="campo">Tasa de Interés</span>
        <span class="valor">${esc(data.tasa)}</span>
      </div>
      <div class="bloque-condicion">
        <span class="campo">N° de Cuotas</span>
        <span class="valor">${data.numeroCuotas}</span>
      </div>
      <div class="bloque-condicion">
        <span class="campo">Cuota Mensual</span>
        <span class="valor">${esc(data.cuotaMensual)}</span>
      </div>
      <div class="bloque-condicion">
        <span class="campo">Interés Total</span>
        <span class="valor">${esc(data.totalInteres)}</span>
      </div>
      <div class="bloque-condicion">
        <span class="campo">Total a Pagar</span>
        <span class="valor">${esc(data.totalPagar)}</span>
      </div>
    </section>

    <section class="seccion-fechas">
      <div class="bloque-fecha">
        <span class="campo">Fecha de Desembolso</span>
        <span class="valor">${esc(data.fechaDesembolso)}</span>
      </div>
      <div class="bloque-fecha">
        <span class="campo">Primer Vencimiento</span>
        <span class="valor">${esc(data.fechaPrimerVencimiento)}</span>
      </div>
      <div class="bloque-fecha">
        <span class="campo">Última Cuota</span>
        <span class="valor">${esc(data.fechaUltimaCuota)}</span>
      </div>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">I</span>
        <h2>Programación de Cuotas</h2>
      </div>

      <table class="tabla-cronograma">
        <thead>
          <tr>
            <th>N°</th>
            <th>Vencimiento</th>
            <th class="der">Interés</th>
            <th class="der">Amortización</th>
            <th class="der">Cuota</th>
            <th class="der">Saldo</th>
            <th class="der">Pagado</th>
            <th class="der">Pendiente</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
          <tr class="fila-total">
            <td colspan="3" class="der">Total</td>
            <td class="der">${esc(data.totalAmortizacion)}</td>
            <td class="der">${esc(data.totalCuota)}</td>
            <td class="der"></td>
            <td class="der">${esc(data.totalPagado)}</td>
            <td class="der">${esc(data.totalPendiente)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-notas">
      <span class="campo">Observaciones</span>
      <div class="caja-notas">${notas}</div>
    </section>

    <section class="seccion-firmas">
      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Firma del Socio</p>
      </div>

      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Firma del Presidente</p>
      </div>
    </section>

  </div>
</body>
</html>`
}
