import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env'
import { errorHandler } from './middeware/errorHandler'
import { seedDatabase } from './config/seed'
import socioRoutes from './modules/socios/socioRoutes'
import fondosRoutes from './modules/fondos/fondoRoutes'
import aportesRoutes from './modules/aportes/aporteRoutes'
import ahorrosRoutes from './modules/ahorros/ahorroRoutes'
import creditosRoutes from './modules/creditos/creditoRoutes'
import cajaRoutes from './modules/caja/cajaRoutes'
import tesoreriaRoutes from './modules/tesoreria/tesoreriaRoutes'
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
  max: 100,
  message: { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
})
app.use('/api/', limiter)

// Parsing
app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Archivos estáticos (uploads)
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)))

// Rutas
app.use('/api/socios', socioRoutes)
app.use('/api/fondos', fondosRoutes)
app.use('/api/aportes', aportesRoutes)
app.use('/api/ahorros', ahorrosRoutes)
app.use('/api/creditos', creditosRoutes)
app.use('/api/caja', cajaRoutes)
app.use('/api/tesoreria', tesoreriaRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/auditoria', auditoriaRoutes)
app.use('/api/dashboard', dashboardRoutes)

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
