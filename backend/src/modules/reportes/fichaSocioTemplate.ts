export interface FichaBeneficiario {
  dni: string
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  parentesco: string
  fechaNacimiento: string
  telefono: string
}

export interface FichaSocioData {
  fichaNumero: string
  organizacion: string
  lema: string
  codigo: string
  dni: string
  genero: string
  apellidoPaterno: string
  apellidoMaterno: string
  nombres: string
  fechaNacimiento: string
  estadoCivil: string
  telefono: string
  email: string
  fechaIngreso: string
  direccion: string
  fotoDataUri: string | null
  beneficiarios: FichaBeneficiario[]
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
  margin-bottom: 30px;
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

.encabezado-seccion {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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

.seccion-socio {
  padding-bottom: 26px;
  margin-bottom: 26px;
  border-bottom: 1px solid var(--linea);
}

.contenido-socio {
  display: flex;
  gap: 34px;
  align-items: flex-start;
}

.columna-datos {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 24px;
  align-content: start;
}

.dato {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 0;
  border-bottom: 1px dotted var(--linea);
  min-width: 0;
}

.dato.span-2 { grid-column: span 2; }
.dato.span-3 { grid-column: span 3; }

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

.columna-foto {
  flex-shrink: 0;
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.marco-foto {
  width: 100px;
  height: 120px;
  border: 1px solid var(--linea);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--tinta-suave);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: repeating-linear-gradient(45deg, #fff, #fff 8px, #f8fafc 8px, #f8fafc 16px);
  position: relative;
}

.marco-foto::after {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid var(--linea-suave);
  border-radius: 2px;
}

.marco-foto img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-texto {
  position: relative;
  z-index: 1;
}

.firma-huella { width: 100%; margin-top: 6px; }

.linea-firma { border-top: 1px solid var(--tinta); height: 30px; width: 100%; }

.seccion-beneficiarios { margin-bottom: 30px; }

.tabla-beneficiarios {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}

.tabla-beneficiarios th {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: left;
  color: var(--navy);
  padding: 7px 10px;
  border-bottom: 1.5px solid var(--navy);
}

.tabla-beneficiarios th:first-child { padding-left: 0; }

.tabla-beneficiarios td {
  font-size: 12px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--linea-suave);
  color: var(--tinta);
  text-transform: uppercase;
}

.tabla-beneficiarios td:first-child { padding-left: 0; }

.tabla-beneficiarios tbody tr:nth-child(even) { background: #f8fafc; }

.tabla-beneficiarios .col-num {
  width: 40px;
  color: var(--oro);
  font-family: var(--serif);
  font-weight: 700;
}

.tabla-beneficiarios .sin-dato { color: var(--tinta-suave); }

.tabla-beneficiarios .fila-vacia td { height: 26px; }

.seccion-firmas {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding: 0 40px;
  margin-top: 110px;
}

.bloque-firma { flex: 1; text-align: center; }
.bloque-firma .linea-firma { height: 4px; }

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
  .tabla-beneficiarios tbody tr:hover { background: transparent; }
  .seccion-socio, .seccion-beneficiarios { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function filaVacia(): string {
  return `<tr class="fila-vacia"><td class="col-num"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
}

function filaBeneficiario(b: FichaBeneficiario, index: number): string {
  return `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td>${esc(b.dni)}</td>
      <td>${esc(b.apellidoPaterno)}</td>
      <td>${esc(b.apellidoMaterno)}</td>
      <td>${esc(b.nombres)}</td>
      <td>${esc(b.parentesco)}</td>
      <td>${esc(b.fechaNacimiento)}</td>
      <td class="${b.telefono === '—' ? 'sin-dato' : ''}">${esc(b.telefono)}</td>
    </tr>`
}

export function buildFichaSocioHtml(data: FichaSocioData): string {
  const foto = data.fotoDataUri
    ? `<img src="${data.fotoDataUri}" alt="Fotografía" />`
    : `<span class="foto-texto">Fotografía</span>`

  const filasBeneficiarios = data.beneficiarios.map(filaBeneficiario).join('\n')

  // Si hay menos de 2 beneficiarios se dejan filas vacías para mantener el formato.
  const filasVacias = Math.max(0, 2 - data.beneficiarios.length)
  const filasVaciasHtml = Array.from({ length: filasVacias }, filaVacia).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ficha Padrón de Socio</title>
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
        <h1>Ficha Padrón de Socio</h1>
      </div>

      <div class="ficha-numero">
        <span class="ficha-etiqueta">Ficha N°</span>
        <span class="ficha-valor">${esc(data.fichaNumero)}</span>
      </div>
    </header>

    <section class="seccion-socio">
      <div class="encabezado-seccion">
        <span class="numeracion">I</span>
        <h2>Datos del Socio</h2>
      </div>

      <div class="contenido-socio">
        <div class="columna-datos">
          <div class="dato">
            <span class="campo">Código de Socio</span>
            <span class="valor">${esc(data.codigo)}</span>
          </div>
          <div class="dato">
            <span class="campo">DNI</span>
            <span class="valor">${esc(data.dni)}</span>
          </div>
          <div class="dato">
            <span class="campo">Sexo</span>
            <span class="valor">${esc(data.genero)}</span>
          </div>

          <div class="dato">
            <span class="campo">Apellido Paterno</span>
            <span class="valor">${esc(data.apellidoPaterno)}</span>
          </div>
          <div class="dato">
            <span class="campo">Apellido Materno</span>
            <span class="valor">${esc(data.apellidoMaterno)}</span>
          </div>
          <div class="dato">
            <span class="campo">Nombres</span>
            <span class="valor">${esc(data.nombres)}</span>
          </div>

          <div class="dato">
            <span class="campo">Fecha de Nacimiento</span>
            <span class="valor">${esc(data.fechaNacimiento)}</span>
          </div>
          <div class="dato">
            <span class="campo">Estado Civil</span>
            <span class="valor">${esc(data.estadoCivil)}</span>
          </div>
          <div class="dato">
            <span class="campo">Teléfono</span>
            <span class="valor">${esc(data.telefono)}</span>
          </div>

          <div class="dato span-2">
            <span class="campo">Correo Electrónico</span>
            <span class="valor">${esc(data.email)}</span>
          </div>
          <div class="dato">
            <span class="campo">Fecha de Ingreso</span>
            <span class="valor">${esc(data.fechaIngreso)}</span>
          </div>

          <div class="dato span-3">
            <span class="campo">Dirección</span>
            <span class="valor">${esc(data.direccion)}</span>
          </div>
        </div>

        <aside class="columna-foto">
          <div class="marco-foto">${foto}</div>
          <div class="firma-huella">
            <div class="linea-firma"></div>
          </div>
        </aside>
      </div>
    </section>

    <section class="seccion-beneficiarios">
      <div class="encabezado-seccion">
        <span class="numeracion">II</span>
        <h2>Beneficiarios</h2>
      </div>

      <table class="tabla-beneficiarios">
        <thead>
          <tr>
            <th class="col-num">N°</th>
            <th>DNI</th>
            <th>Apellido Paterno</th>
            <th>Apellido Materno</th>
            <th>Nombres</th>
            <th>Parentesco</th>
            <th>Fecha de Nacimiento</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          ${filasBeneficiarios}
          ${filasVaciasHtml}
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
        <p class="nombre-firma">Firma del Presidente</p>
      </div>
    </section>

  </div>
</body>
</html>`
}
