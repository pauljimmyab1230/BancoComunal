import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env'
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

const app = express()

// Seguridad
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))

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
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Archivos estáticos (uploads) — solo accesibles con token válido
app.use('/uploads', authenticateUploads, express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)))

// Rutas
app.use('/api/socios', authenticate, socioRoutes)
app.use('/api/fondos', authenticate, fondosRoutes)
app.use('/api/aportes', authenticate, aportesRoutes)
app.use('/api/creditos', authenticate, creditosRoutes)
app.use('/api/caja', authenticate, cajaRoutes)
app.use('/api/reportes', authenticate, reportesRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/auditoria', authenticate, auditoriaRoutes)
app.use('/api/dashboard', authenticate, dashboardRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Banquito Solidario API funcionando', timestamp: new Date().toISOString() })
})

// Error handler
app.use(errorHandler)

// Iniciar servidor
async function start() {
  try {
    await seedDatabase()

    // Garantiza que existan los conceptos de caja por defecto (ING-PRESTAMO, ING-CUOTA, etc.).
    await cajaService.crearConceptosPorDefecto()

    // Marcar cuotas vencidas cada 30 minutos para mantener el estado al día.
    await marcarCuotasVencidas().catch(() => {})
    setInterval(() => {
      marcarCuotasVencidas().catch(() => {})
    }, 30 * 60 * 1000)

    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║     Banquito Solidario - API             ║
║     http://localhost:${env.PORT}           ║
║     ${new Date().toISOString()}          ║
╚══════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('Error al iniciar servidor:', error)
    process.exit(1)
  }
}

start()
