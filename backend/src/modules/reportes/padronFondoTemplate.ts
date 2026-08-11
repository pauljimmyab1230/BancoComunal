export interface PadronSocioRow {
  numero: number
  numeroSocio: string
  dni: string
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  cargo: string
  ingreso: string
  estado: 'ACTIVO' | 'INACTIVO'
}

export interface PadronFondoData {
  organizacion: string
  lema: string
  fechaEmision: string
  nombreFondo: string
  monedaLabel: string
  capitalInicial: string
  estadoFondo: string
  totalSocios: number
  activos: number
  retirados: number
  totalAportado: string
  filas: PadronSocioRow[]
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

.tabla td {
  font-size: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--linea-suave);
  color: var(--tinta);
  text-transform: uppercase;
}

.tabla td:first-child { padding-left: 0; }
.tabla tbody tr:nth-child(even) { background: #f8fafc; }

.tabla .col-num {
  width: 34px;
  color: var(--oro);
  font-family: var(--serif);
  font-weight: 700;
}

.badge-activo,
.badge-retirado {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
}

.badge-activo { color: #166534; background: #dcfce7; }
.badge-retirado { color: #991b1b; background: #fee2e2; }

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

function filaSocio(row: PadronSocioRow): string {
  const badge = row.estado === 'ACTIVO'
    ? '<span class="badge-activo">Activo</span>'
    : '<span class="badge-retirado">Retirado</span>'
  return `
    <tr>
      <td class="col-num">${row.numero}</td>
      <td>${esc(row.numeroSocio)}</td>
      <td>${esc(row.dni)}</td>
      <td>${esc(row.apellidoPaterno)}</td>
      <td>${esc(row.apellidoMaterno)}</td>
      <td>${esc(row.nombres)}</td>
      <td>${esc(row.cargo)}</td>
      <td>${esc(row.ingreso)}</td>
      <td>${badge}</td>
    </tr>`
}

export function buildPadronFondoHtml(data: PadronFondoData): string {
  const filas = data.filas.map(filaSocio).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Padrón de Socios — Fondo</title>
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
        <h1>Padrón de Socios</h1>
      </div>

      <div class="ficha-numero">
        <span class="ficha-etiqueta">Emitido el</span>
        <span class="ficha-valor">${esc(data.fechaEmision)}</span>
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
        <span class="campo">Capital Inicial</span>
        <span class="valor">${esc(data.capitalInicial)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Estado</span>
        <span class="valor">${esc(data.estadoFondo)}</span>
      </div>
    </section>

    <section class="seccion-resumen">
      <div class="tarjeta">
        <span class="tarjeta-valor">${data.totalSocios}</span>
        <span class="tarjeta-etiqueta">Total de Socios</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${data.activos}</span>
        <span class="tarjeta-etiqueta">Activos</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${data.retirados}</span>
        <span class="tarjeta-etiqueta">Retirados</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.totalAportado)}</span>
        <span class="tarjeta-etiqueta">Total Aportado</span>
      </div>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">I</span>
        <h2>Listado de Socios del Fondo</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>N°</th>
            <th>N° Socio</th>
            <th>DNI</th>
            <th>Apellido Paterno</th>
            <th>Apellido Materno</th>
            <th>Nombres</th>
            <th>Cargo</th>
            <th>Ingreso</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
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
