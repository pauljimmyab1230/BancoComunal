import { chromium, type Browser } from 'playwright'

let browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }
  return browserPromise
}

export interface PdfOptions {
  format?: string
  landscape?: boolean
  margins?: { top: string; bottom: string; left: string; right: string }
}

/**
 * Renderiza un documento HTML a PDF con Chromium headless (Playwright).
 * Reutiliza una única instancia del navegador entre peticiones.
 */
export async function renderHtmlToPdf(html: string, options: PdfOptions = {}): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: (options.format as any) || 'A4',
      landscape: options.landscape ?? false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: options.margins ?? { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}

/** Cierra el navegador de Playwright (útil en tests o al apagar el servidor). */
export async function closePdfBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close()
    browserPromise = null
  }
}
