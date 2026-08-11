export interface ResumenData {
  capitalAportado: string
  saldoPrestamos: string
  interesesPagar: string
  saldoNeto: string
}

export interface AporteGrupoItem {
  periodo: string
  concepto: string
  numero: string
  monto: string
  multas: string
}

export interface PrestamoItem {
  numero: string
  fecha: string
  monto: string
  pagado: string
  saldo: string
  cuotas: string
  estado: string
}

export interface CuotaItem {
  prestamo: string
  numero: string
  vencimiento: string
  interes: string
  capital: string
  total: string
  estado: string
}

export interface MovimientoItem {
  fecha: string
  descripcion: string
  concepto: string
  ingreso: string
  egreso: string
}

export interface AporteTotal {
  numero: string
  monto: string
  multas: string
}

export interface PrestamoTotal {
  monto: string
  pagado: string
  saldo: string
  cuotas: string
}

export interface CuotaTotal {
  interes: string
  capital: string
  total: string
}

export interface MovimientoTotal {
  ingreso: string
  egreso: string
}

export interface EstadoCuentaData {
  organizacion: string
  lema: string
  corteAl: string
  nombreCompleto: string
  dni: string
  fondo: string
  resumen: ResumenData
  aportes: AporteGrupoItem[]
  aporteTotal: AporteTotal
  prestamos: PrestamoItem[]
  prestamoTotal: PrestamoTotal
  cuotas: CuotaItem[]
  cuotaTotal: CuotaTotal
  movimientos: MovimientoItem[]
  movimientoTotal: MovimientoTotal
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
  background: #f8fafc;
  padding: 20px;
  line-height: 1.5;
}

.hoja {
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: var(--papel);
  padding: 44px 52px 32px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.18);
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

.bloque-dato {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bloque-dato + .bloque-dato {
  border-left: 1px solid var(--linea-suave);
  padding-left: 20px;
}

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

.bloque-dato .valor.fondo {
  color: var(--oro);
}

.seccion-resumen {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 8px;
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

.nota-saldo {
  font-size: 10px;
  color: var(--tinta-suave);
  margin-bottom: 24px;
  padding-left: 2px;
}

.seccion-tabla {
  margin-bottom: 26px;
}

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

.tabla th.der,
.tabla td.der { text-align: right; }

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

.tabla .fila-total td {
  border-top: 1.5px solid var(--navy);
  border-bottom: none;
  font-weight: 700;
  color: var(--navy);
  background: #eff6ff;
  padding: 10px;
  font-size: 12.5px;
}

.badge-activo,
.badge-cancelado,
.badge-vencida,
.badge-pendiente {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
}

.badge-activo { color: #1d4ed8; background: #dbeafe; }
.badge-cancelado { color: #166534; background: #dcfce7; }
.badge-vencida { color: #991b1b; background: #fee2e2; }
.badge-pendiente { color: #b45309; background: #fef3c7; }

.seccion-firmas {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding: 0 40px;
  margin-top: 110px;
}

.bloque-firma {
  flex: 1;
  text-align: center;
}

.linea-firma { border-top: 1px solid var(--tinta); height: 30px; width: 100%; }

.bloque-firma .linea-firma { height: 4px; }

.nombre-firma {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--tinta);
  margin-top: 8px;
}

.sin-datos {
  border: 1px dashed var(--linea);
  border-radius: 10px;
  padding: 22px;
  text-align: center;
  color: var(--tinta-suave);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

@page { size: A4; margin: 0; }

@media print {
  body { background: #ffffff; padding: 0; }
  .hoja { box-shadow: none; max-width: none; min-height: auto; padding: 8mm 12mm; }
  .seccion-tabla, .seccion-datos, .seccion-resumen { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function badgeEstado(estado: string, clase: string, texto: string): string {
  return `<span class="${clase}">${esc(texto)}</span>`
}

export function buildEstadoCuentaHtml(data: EstadoCuentaData): string {
  const aportesRows = data.aportes.length === 0
    ? `<tr><td colspan="5"><p class="sin-datos">El socio no registra aportes</p></td></tr>`
    : data.aportes.map((a) => `
      <tr>
        <td>${esc(a.periodo)}</td>
        <td>${esc(a.concepto)}</td>
        <td class="der">${esc(a.numero)}</td>
        <td class="der">${esc(a.monto)}</td>
        <td class="der">${esc(a.multas)}</td>
      </tr>`).join('\n')

  const prestamosRows = data.prestamos.length === 0
    ? `<tr><td colspan="7"><p class="sin-datos">El socio no registra préstamos</p></td></tr>`
    : data.prestamos.map((p) => `
      <tr>
        <td class="col-num">${esc(p.numero)}</td>
        <td>${esc(p.fecha)}</td>
        <td class="der">${esc(p.monto)}</td>
        <td class="der">${esc(p.pagado)}</td>
        <td class="der">${esc(p.saldo)}</td>
        <td class="der">${esc(p.cuotas)}</td>
        <td>${badgeEstado(p.estado, p.estado === 'CANCELADO' ? 'badge-cancelado' : 'badge-activo', p.estado === 'CANCELADO' ? 'Cancelado' : 'Activo')}</td>
      </tr>`).join('\n')

  const cuotasRows = data.cuotas.length === 0
    ? `<tr><td colspan="7"><p class="sin-datos">El socio no tiene cuotas pendientes</p></td></tr>`
    : data.cuotas.map((c) => `
      <tr>
        <td class="col-num">${esc(c.prestamo)}</td>
        <td>${esc(c.numero)}</td>
        <td>${esc(c.vencimiento)}</td>
        <td class="der">${esc(c.interes)}</td>
        <td class="der">${esc(c.capital)}</td>
        <td class="der">${esc(c.total)}</td>
        <td>${badgeEstado(c.estado, c.estado === 'VENCIDA' ? 'badge-vencida' : 'badge-pendiente', c.estado === 'VENCIDA' ? 'Vencida' : 'Pendiente')}</td>
      </tr>`).join('\n')

  const movimientosRows = data.movimientos.length === 0
    ? `<tr><td colspan="5"><p class="sin-datos">El socio no registra movimientos</p></td></tr>`
    : data.movimientos.map((m) => `
      <tr>
        <td>${esc(m.fecha)}</td>
        <td>${esc(m.descripcion)}</td>
        <td>${esc(m.concepto)}</td>
        <td class="der">${esc(m.ingreso)}</td>
        <td class="der">${esc(m.egreso)}</td>
      </tr>`).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Estado de Cuenta del Socio</title>
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
        <h1>Estado de Cuenta</h1>
      </div>

      <div class="ficha-numero">
        <span class="ficha-etiqueta">Corte al</span>
        <span class="ficha-valor">${esc(data.corteAl)}</span>
      </div>
    </header>

    <section class="seccion-datos">
      <div class="bloque-dato">
        <span class="campo">Socio</span>
        <span class="valor">${esc(data.nombreCompleto)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">DNI</span>
        <span class="valor">${esc(data.dni)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Fondo Rotatorio</span>
        <span class="valor fondo">${esc(data.fondo)}</span>
      </div>
      <div class="bloque-dato">
        <span class="campo">Fecha de Corte</span>
        <span class="valor">${esc(data.corteAl)}</span>
      </div>
    </section>

    <section class="seccion-resumen">
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.resumen.capitalAportado)}</span>
        <span class="tarjeta-etiqueta">Capital Aportado</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.resumen.saldoPrestamos)}</span>
        <span class="tarjeta-etiqueta">Saldo por Préstamos</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.resumen.interesesPagar)}</span>
        <span class="tarjeta-etiqueta">Intereses por Pagar</span>
      </div>
      <div class="tarjeta">
        <span class="tarjeta-valor">${esc(data.resumen.saldoNeto)}</span>
        <span class="tarjeta-etiqueta">Saldo Neto del Socio</span>
      </div>
    </section>

    <p class="nota-saldo">
      Saldo neto = Capital aportado − (saldo por préstamos + intereses por pagar).
      Positivo: el socio tiene saldo a favor en el fondo.
    </p>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">I</span>
        <h2>Aportes en el Fondo</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Período</th>
            <th>Concepto</th>
            <th class="der">N° Aportes</th>
            <th class="der">Monto</th>
            <th class="der">Multas</th>
          </tr>
        </thead>
        <tbody>
          ${aportesRows}
          <tr class="fila-total">
            <td colspan="2" class="der">Total Aportado en el Fondo</td>
            <td class="der">${esc(data.aporteTotal.numero)}</td>
            <td class="der">${esc(data.aporteTotal.monto)}</td>
            <td class="der">${esc(data.aporteTotal.multas)}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">II</span>
        <h2>Préstamos en el Fondo</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>N°</th>
            <th>Fecha</th>
            <th class="der">Monto</th>
            <th class="der">Pagado</th>
            <th class="der">Saldo</th>
            <th class="der">Cuotas</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${prestamosRows}
          <tr class="fila-total">
            <td colspan="2" class="der">Total</td>
            <td class="der">${esc(data.prestamoTotal.monto)}</td>
            <td class="der">${esc(data.prestamoTotal.pagado)}</td>
            <td class="der">${esc(data.prestamoTotal.saldo)}</td>
            <td class="der">${esc(data.prestamoTotal.cuotas)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">III</span>
        <h2>Próximas Cuotas por Pagar</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Préstamo</th>
            <th>Cuota</th>
            <th>Vencimiento</th>
            <th class="der">Interés</th>
            <th class="der">Capital</th>
            <th class="der">Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${cuotasRows}
          <tr class="fila-total">
            <td colspan="3" class="der">Total por Pagar</td>
            <td class="der">${esc(data.cuotaTotal.interes)}</td>
            <td class="der">${esc(data.cuotaTotal.capital)}</td>
            <td class="der">${esc(data.cuotaTotal.total)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-tabla">
      <div class="encabezado-seccion">
        <span class="numeracion">IV</span>
        <h2>Movimientos del Socio en el Fondo</h2>
      </div>

      <table class="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Concepto</th>
            <th class="der">Ingreso</th>
            <th class="der">Egreso</th>
          </tr>
        </thead>
        <tbody>
          ${movimientosRows}
          <tr class="fila-total">
            <td colspan="3" class="der">Total</td>
            <td class="der">${esc(data.movimientoTotal.ingreso)}</td>
            <td class="der">${esc(data.movimientoTotal.egreso)}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="seccion-firmas">
      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Firma del Socio</p>
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
