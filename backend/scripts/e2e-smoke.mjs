// Suite E2E de humo (reproducible). Requiere backend en :3000 y frontend en :5173.
// Uso: npm run test:e2e  (desde backend/)
import { chromium } from 'playwright'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173'
const API = process.env.E2E_API_URL || 'http://localhost:3000'
const CREDENCIALES = {
  username: process.env.E2E_USER || 'admin',
  password: process.env.E2E_PASSWORD || 'admin123',
}

const resultados = []
const registrar = (nombre, ok, detalle = '') =>
  resultados.push(`${ok ? '✔' : '✘'} ${nombre}${detalle ? ' — ' + detalle : ''}`)

async function iniciarSesion(pagina) {
  await pagina.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await pagina.getByLabel(/usuario/i).first().fill(CREDENCIALES.username)
  await pagina.getByLabel(/contraseña/i).first().fill(CREDENCIALES.password)
  await pagina.getByRole('button', { name: /ingresar/i }).click()
  await pagina.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
}

async function comprobarModulo(pagina, ruta, selector) {
  await pagina.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(400)
  const visible = await pagina.getByText(selector).first().isVisible().catch(() => false)
  return visible
}

const navegador = await chromium.launch({ channel: 'msedge', headless: true })

try {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
  const pagina = await contexto.newPage()

  await iniciarSesion(pagina)
  registrar('login', true)

  const modulos = [
    ['/', /dashboard|bienvenido|resumen/i],
    ['/socios', /socios|nuevo socio/i],
    ['/fondos', /fondos|nuevo fondo/i],
    ['/aportes', /aportes|nuevo aporte/i],
    ['/creditos', /créditos|nuevo crédito/i],
    ['/cotizaciones', /cotizaciones/i],
    ['/caja', /caja/i],
    ['/reportes', /reportes/i],
    ['/configuracion', /configuración/i],
    ['/auditoria', /auditoría|auditoria/i],
  ]
  for (const [ruta, patron] of modulos) {
    const ok = await comprobarModulo(pagina, ruta, patron)
    registrar(`módulo ${ruta || '/'} carga`, ok)
  }

  // Tema oscuro
  await pagina.goto(`${BASE}/configuracion`, { waitUntil: 'networkidle' })
  await pagina.locator('button[aria-label*="tema"], button[aria-label*="theme"]').first().click()
  const dark = await pagina.evaluate(() => document.documentElement.classList.contains('dark'))
  registrar('alternancia de tema oscuro', dark)

  // Health check de la API
  const health = await contexto.request.get(`${API}/api/health`)
  registrar('health check API', health.ok())

  await contexto.close()
} catch (error) {
  registrar('flujo general', false, String(error))
} finally {
  await navegador.close()
}

console.log(resultados.join('\n'))
const fallos = resultados.filter((r) => r.startsWith('✘')).length
console.log(`\n${resultados.length - fallos}/${resultados.length} comprobaciones correctas`)
process.exit(fallos > 0 ? 1 : 0)
