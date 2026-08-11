export interface ResumenFondoMes {
  mes: string
  ingresos: string
  egresos: string
  saldo: string
}

export interface ResumenFondoConcepto {
  concepto: string
  cantidad: number
  monto: string
}

export interface ResumenFondoData {
  organizacion: string
  lema: string
  fechaEmision: string
  nombreFondo: string
  monedaLabel: string
  fechaCorte: string
  estadoFondo: string
  capitalInicial: string
  aportesFondo: string
  interesesGanados: string
  totalFondo: string
  sociosActivos: number
  prestamosActivos: number
  capitalPrestado: string
  capitalDisponible: string
  anoPeriodo: number
  movimientos: ResumenFondoMes[]
  totalIngresos: string
  totalEgresos: string
  totalSaldo: string
  conceptos: ResumenFondoConcepto[]
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
  font-size: 16px;
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

.bloque-dato .campo {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.bloque-dato .valor {
  font-size: 12px;
  font-weight: 600;
  color: var(--navy);
  text-transform: uppercase;
}

.bloque-dato .valor.fondo { color: var(--oro); }

.seccion-resumen {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}

.tarjeta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 10px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  background: #f8fafc;
}

.tarjeta-valor {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--navy);
}

.tarjeta-valor.destacado { color: var(--oro); }

.tarjeta-etiqueta {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
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
  padding: 8px 10px;
  border-bottom: 1.5px solid var(--navy);
}

.tabla th:first-child { padding-left: 0; }
.tabla th.der, .tabla td.der { text-align: right; }

.tabla td {
  font-size: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--linea-suave);
  color: var(--tinta);
  text-transform: uppercase;
}

.tabla td:first-child { padding-left: 0; }
.tabla tbody tr:nth-child(even) { background: #f8fafc; }

.tabla .fila-total td {
  border-top: 1.5px solid var(--navy);
  border-bottom: none;
  font-weight: 700;
  color: var(--navy);
  background: #eff6ff;
  padding: 10px;
  font-size: 12.5px;
}

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
  .seccion-datos, .seccion-resumen { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function filaMes(row: ResumenFondoMes): string {
  return `
    <tr>
      <td>${esc(row.mes)}</td>
      <td class="der">${esc(row.ingresos)}</td>
      <td class="der">${esc(row.egresos)}</td>
      <td class="der">${esc(row.saldo)}</td>
    </tr>`
}

function filaConcepto(row: ResumenFondoConcepto): string {
  return `
    <tr>
      <td>${esc(row.concepto)}</td>
      <td class="der">${row.cantidad}</td>
      <td class="der">${esc(row.monto)}</td>
    </tr>`
}

export function buildResumenFondoHtml(data: ResumenFondoData): string {
  const movimientos = data.movimientos.map(filaMes).join('\n')
  const conceptos = data.conceptos.map(filaConcepto).join('\n')
  const notas = data.observaciones ? esc(data.observaciones) : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Resumen del Fondo</title>
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
        <h1>Resumen del Fondo</h1>
      </div>

      <div class="ficha-numero">
        <span class="ficha-etiqueta">Corte al</span>
        <span class="ficha-valor">${esc(data.fechaCorte)}</span>
      </div>
    </header>

    <section class="seccion-datos">
      <div class="bloque-dato">
        <span class="campo">Fondo Rotatorio</span>
        <span class="valor fondo">${esc(data.nombreFondo)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Moneda</span>
        <span class="valor">${esc(data.monedaLabel)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Fecha de Corte</span>
        <span class="valor">${esc(data.fechaCorte)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Estado</span>
        <span class="valor">${esc(data.estadoFondo)}</span>
      </div>
    </section>

    <section class="seccion-resumen">
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.capitalInicial)}</span>
        <span class="tarjeta-etiqueta">Capital Inicial</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.aportesFondo)}</span>
        <span class="tarjeta-etiqueta">Aportes del Fondo</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.interesesGanados)}</span>
        <span class="tarjeta-etiqueta">Intereses Ganados</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor destacado">${esc(data.totalFondo)}</span>
        <span class="tarjeta-etiqueta">Total del Fondo</span>
      </div>
    </section>

    <section class="seccion-resumen">
      <div class="tarjeta">
        <span class="tarjeta-valor">${data.sociosActivos}</span>
        <span class="tarjeta-etiqueta">Socios Activos</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${data.prestamosActivos}</span>
        <span class="tarjeta-etiqueta">Préstamos Activos</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.capitalPrestado)}</span>
        <span class="tarjeta-etiqueta">Capital Prestado</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.capitalDisponible)}</span>
        <span class="tarjeta-etiqueta">Capital Disponible</span>
      </div>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">I</span>
        <h2>Movimientos del Período (${data.anoPeriodo})</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Mes</th>
            <th class="der">Ingresos</th>
            <th class="der">Egresos</th>
            <th class="der">Saldo del Mes</th>
          </tr>
        </thead>
        <tbody>
          ${movimientos}
          <tr class="fila-total">
            <td class="der">Total del Período</td>
            <td class="der">${esc(data.totalIngresos)}</td>
            <td class="der">${esc(data.totalEgresos)}</td>
            <td class="der">${esc(data.totalSaldo)}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">II</span>
        <h2>Aportes por Concepto</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="der">N° Aportes</th>
            <th class="der">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${conceptos}
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
        <p class="nombre-firma">Firma del Presidente</p>
      </div>

      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Firma del Tesorero</p>
      </div>
    </section>

  </div>
</body>
</html>`
}
