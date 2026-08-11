export interface ComprobanteAporteData {
  organizacion: string
  lema: string
  numeroComprobante: string
  fecha: string
  socio: string
  dni: string
  caja: string
  concepto: string
  periodo: string
  metodoPago: string
  referencia: string
  descripcion: string
  montoLetras: string
  monto: string
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

.numero-comprobante {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 10px 16px;
  background: #fff;
}

.nc-etiqueta {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--oro);
}

.nc-valor {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 1px;
}

.campo {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.valor {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--navy);
  text-transform: uppercase;
}

.seccion-receptor {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 12px;
}

.bloque {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bloque + .bloque {
  border-left: 1px solid var(--linea-suave);
  padding-left: 20px;
}

.seccion-concepto {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 12px;
  background: #f8fafc;
}

.bloque-concepto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.bloque-concepto + .bloque-concepto {
  border-left: 1px solid var(--linea-suave);
  padding-left: 20px;
}

.seccion-detalle {
  border: 1px dashed var(--linea);
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 12px;
}

.bloque-detalle {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bloque-detalle .valor { text-transform: none; }

.seccion-monto {
  display: flex;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 16px;
}

.bloque-monto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--linea);
  border-radius: 8px;
  padding: 14px 18px;
  justify-content: center;
}

.valor-letras {
  font-family: var(--serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--navy);
  text-transform: uppercase;
}

.monto-numeral {
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1.5px solid var(--navy);
  border-radius: 8px;
  background: #eff6ff;
  padding: 10px;
}

.mn-etiqueta {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.mn-valor {
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--navy);
}

.seccion-notas { margin-bottom: 30px; }

.caja-notas {
  margin-top: 6px;
  border: 1px dashed var(--linea);
  border-radius: 8px;
  min-height: 44px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--tinta-suave);
}

.seccion-firmas {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding: 0 30px;
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

.detalle-firma {
  font-size: 9.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--tinta-suave);
  margin-top: 2px;
}

@page { size: A4; margin: 0; }

@media print {
  body { background: #ffffff; }
  .hoja { box-shadow: none; max-width: none; min-height: auto; padding: 8mm 12mm; }
  .seccion-receptor, .seccion-concepto, .seccion-monto { break-inside: avoid; }
}
`

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildComprobanteAporteHtml(data: ComprobanteAporteData): string {
  const notas = data.observaciones ? esc(data.observaciones) : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante de Ingreso</title>
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
        <h1>Comprobante de Ingreso</h1>
      </div>

      <div class="numero-comprobante">
        <span class="nc-etiqueta">N°</span>
        <span class="nc-valor">${esc(data.numeroComprobante)}</span>
      </div>
    </header>

    <section class="seccion-receptor">
      <div class="bloque">
        <span class="campo">Fecha</span>
        <span class="valor">${esc(data.fecha)}</span>
      </div>
      <div class="bloque">
        <span class="campo">Recibimos de</span>
        <span class="valor">${esc(data.socio)}</span>
      </div>
      <div class="bloque">
        <span class="campo">DNI</span>
        <span class="valor">${esc(data.dni)}</span>
      </div>
      <div class="bloque">
        <span class="campo">Caja</span>
        <span class="valor">${esc(data.caja)}</span>
      </div>
    </section>

    <section class="seccion-concepto">
      <div class="bloque-concepto">
        <span class="campo">Concepto de Ingreso</span>
        <span class="valor">${esc(data.concepto)}</span>
      </div>
      <div class="bloque-concepto">
        <span class="campo">Período</span>
        <span class="valor">${esc(data.periodo)}</span>
      </div>
      <div class="bloque-concepto">
        <span class="campo">Método de Pago</span>
        <span class="valor">${esc(data.metodoPago)}</span>
      </div>
      <div class="bloque-concepto">
        <span class="campo">Referencia</span>
        <span class="valor">${esc(data.referencia)}</span>
      </div>
    </section>

    <section class="seccion-detalle">
      <div class="bloque-detalle">
        <span class="campo">Descripción</span>
        <span class="valor">${esc(data.descripcion)}</span>
      </div>
    </section>

    <section class="seccion-monto">
      <div class="bloque-monto">
        <span class="campo">Monto en Letras</span>
        <span class="valor-letras">${esc(data.montoLetras)}</span>
      </div>
      <div class="monto-numeral">
        <span class="mn-etiqueta">Monto</span>
        <span class="mn-valor">${esc(data.monto)}</span>
      </div>
    </section>

    <section class="seccion-notas">
      <span class="campo">Observaciones</span>
      <div class="caja-notas">${notas}</div>
    </section>

    <section class="seccion-firmas">
      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Recibí Conforme</p>
        <p class="detalle-firma">Firma del Socio</p>
      </div>

      <div class="bloque-firma">
        <div class="linea-firma"></div>
        <p class="nombre-firma">Cajero / Tesorero</p>
        <p class="detalle-firma">Firma y sello</p>
      </div>
    </section>

  </div>
</body>
</html>`
}
