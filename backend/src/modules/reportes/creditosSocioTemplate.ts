export interface CreditoItem {
  fecha: string
  monto: string
  tasa: string
  cuotas: string
  pagadas: string
  saldoPendiente: string
  estado: string
}

export interface CreditoGrupo {
  fondo: string
  moneda: string
  items: CreditoItem[]
  subtotal: string
}

export interface CreditosSocioData {
  organizacion: string
  lema: string
  fechaEmision: string
  nombreCompleto: string
  dni: string
  codigo: string
  grupos: CreditoGrupo[]
  total: string
}

const css = `
:root {
  --navy: #0f172a;
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
  margin-bottom: 24px;
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

.fecha-emision {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 10px 18px;
  background: #fff;
}

.fecha-etiqueta {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.fecha-valor {
  font-family: var(--serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 1px;
}

.bloque-socio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 24px;
  border: 1px solid var(--linea);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 26px;
}

.dato {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 0;
  min-width: 0;
}

.dato .campo {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dato .valor {
  font-size: 13px;
  font-weight: 600;
  color: var(--navy);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grupo { margin-bottom: 22px; }

.grupo-titulo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1.5px solid var(--navy);
  padding-bottom: 6px;
  margin-bottom: 6px;
}

.grupo-titulo h2 {
  font-family: var(--serif);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--navy);
}

.grupo-titulo .subtotal {
  font-size: 12px;
  font-weight: 600;
  color: var(--oro);
  white-space: nowrap;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}

.tabla th {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: left;
  color: var(--navy);
  padding: 7px 10px;
  border-bottom: 1px solid var(--linea);
}

.tabla th:first-child { padding-left: 0; }

.tabla td {
  font-size: 12px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--linea-suave);
  color: var(--tinta);
  text-transform: uppercase;
}

.tabla td:first-child { padding-left: 0; }

.tabla tbody tr:nth-child(even) { background: #f8fafc; }

.tabla .num {
  text-align: right;
  font-weight: 600;
  color: var(--navy);
}

.tabla th.num { text-align: right; }

.estado-activo {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  background: #dbeafe;
  color: #1e40af;
}

.estado-pagado {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  background: #dcfce7;
  color: #166534;
}

.estado-anulado {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  background: #fee2e2;
  color: #991b1b;
}

.resumen {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.caja-total {
  min-width: 240px;
  border: 1.5px solid var(--navy);
  border-radius: 10px;
  padding: 14px 22px;
  text-align: right;
}

.caja-total .total-etiqueta {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.caja-total .total-valor {
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--navy);
  margin-top: 2px;
}

.sin-datos {
  border: 1px dashed var(--linea);
  border-radius: 10px;
  padding: 28px;
  text-align: center;
  color: var(--tinta-suave);
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

@page { size: A4; margin: 0; }

@media print {
  body { background: #ffffff; }
  .hoja { box-shadow: none; max-width: none; min-height: auto; padding: 8mm 12mm; }
  .grupo { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function estadoBadge(estado: string): string {
  if (estado === 'PAGADO') {
    return `<span class="estado-pagado">Pagado</span>`
  }
  if (estado === 'ANULADO') {
    return `<span class="estado-anulado">Anulado</span>`
  }
  return `<span class="estado-activo">Activo</span>`
}

function filaCredito(item: CreditoItem): string {
  return `
    <tr>
      <td>${esc(item.fecha)}</td>
      <td class="num">${esc(item.monto)}</td>
      <td class="num">${esc(item.tasa)}</td>
      <td class="num">${esc(item.cuotas)}</td>
      <td class="num">${esc(item.pagadas)}</td>
      <td class="num">${esc(item.saldoPendiente)}</td>
      <td>${estadoBadge(item.estado)}</td>
    </tr>`
}

export function buildCreditosSocioHtml(data: CreditosSocioData): string {
  const gruposHtml = data.grupos.map((grupo) => `
    <section class="grupo">
      <div class="grupo-titulo">
        <h2>${esc(grupo.fondo)}</h2>
        <span class="subtotal">Subtotal: ${esc(grupo.subtotal)}</span>
      </div>
      <table class="tabla">
        <thead>
          <tr>
            <th>Desembolso</th>
            <th class="num">Monto</th>
            <th class="num">Tasa</th>
            <th class="num">Cuotas</th>
            <th class="num">Pagadas</th>
            <th class="num">Saldo Pend.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${grupo.items.map(filaCredito).join('\n')}
        </tbody>
      </table>
    </section>`).join('\n')

  const cuerpo = data.grupos.length === 0
    ? `<p class="sin-datos">El socio no registra créditos</p>`
    : `${gruposHtml}
      <div class="resumen">
        <div class="caja-total">
          <p class="total-etiqueta">Total Prestado</p>
          <p class="total-valor">${esc(data.total)}</p>
        </div>
      </div>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Historial de Créditos del Socio</title>
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
        <h1>Historial de Créditos del Socio</h1>
      </div>

      <div class="fecha-emision">
        <span class="fecha-etiqueta">Emitido el</span>
        <span class="fecha-valor">${esc(data.fechaEmision)}</span>
      </div>
    </header>

    <section class="bloque-socio">
      <div class="dato">
        <span class="campo">Apellidos y Nombres</span>
        <span class="valor">${esc(data.nombreCompleto)}</span>
      </div>
      <div class="dato">
        <span class="campo">DNI</span>
        <span class="valor">${esc(data.dni)}</span>
      </div>
      <div class="dato">
        <span class="campo">Código de Socio</span>
        <span class="valor">${esc(data.codigo)}</span>
      </div>
    </section>

    ${cuerpo}

  </div>
</body>
</html>`
}
