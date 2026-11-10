import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler } from './middleware/errorHandler'
import { authenticate, authenticateUploads } from './middleware/auth'
import { seedDatabase } from './config/seed'
import { marcarCuotasVencidas } from './modules/creditos/creditoService'
import { cajaService } from './modules/caja/cajaService'
import socioRoutes from './modules/socios/socioRoutes'
import fondosRoutes from './modules/fondos/fondoRoutes'
import aportesRoutes from './modules/aportes/aporteRoutes'
import creditosRoutes from './modules/creditos/creditoRoutes'
import cajaRoutes from './modules/caja/cajaRoutes'
import reportesRoutes from './modules/reportes/reportesRoutes'
import configuracionRoutes from './modules/configuracion/configuracionRoutes'
import auditoriaRoutes from './modules/auditoria/auditoriaRoutes'
import dashboardRoutes from './modules/dashboard/dashboardRoutes'

export const app = express()

// Detrás de un proxy inverso: usar X-Forwarded-For para req.ip y el rate limiting
if (env.TRUST_PROXY !== undefined) {
  app.set('trust proxy', env.TRUST_PROXY)
}

// Seguridad
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim())
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  message: { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
})
app.use('/api/', limiter)

// Parsing
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Archivos estáticos (uploads) — solo accesibles con token válido
app.use(
  '/uploads',
  authenticateUploads,
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR))
)

// Rutas
app.use('/api/socios', authenticate, socioRoutes)
app.use('/api/fondos', authenticate, fondosRoutes)
app.use('/api/aportes', authenticate, aportesRoutes)
app.use('/api/creditos', authenticate, creditosRoutes)
app.use('/api/caja', authenticate, cajaRoutes)
app.use('/api/reportes', authenticate, reportesRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/auditoria', auditoriaRoutes)
app.use('/api/dashboard', authenticate, dashboardRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Banquito Solidario API funcionando',
    timestamp: new Date().toISOString(),
  })
})

// Frontend estático (producción): sirve public/ si contiene el build del SPA
const publicDir = path.resolve(process.cwd(), 'public')
if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next()
      return
    }
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

// Error handler
app.use(errorHandler)

// Iniciar servidor
async function start() {
  try {
    await seedDatabase()

    // Garantiza que existan los conceptos de caja por defecto (ING-PRESTAMO, ING-CUOTA, etc.).
    await cajaService.crearConceptosPorDefecto()

    // Marcar cuotas vencidas cada 30 minutos para mantener el estado al día.
    await marcarCuotasVencidas().catch((err) =>
      logger.error('Error al marcar cuotas vencidas:', err)
    )
    setInterval(
      () => {
        marcarCuotasVencidas().catch((err) => logger.error('Error al marcar cuotas vencidas:', err))
      },
      30 * 60 * 1000
    )

    app.listen(env.PORT, () => {
      logger.info(`Banquito Solidario API funcionando en http://localhost:${env.PORT}`)
    })
  } catch (error) {
    logger.error('Error al iniciar servidor:', error)
    process.exit(1)
  }
}

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
if (!isTest) {
  start()
}
