import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, authorize } from '../../middleware/auth'
import { configuracionController } from './configuracionController'

const router = Router()

// Rate limiter dedicado para login (5 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 1 minuto.',
  },
})

// Rate limiter dedicado para cambio de contraseña (10 por minuto por IP)
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados cambios de contraseña. Intente de nuevo en 1 minuto.',
  },
})

// Rate limiter dedicado para renovación de tokens (30 por minuto por IP)
const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas renovaciones de token. Intente de nuevo en 1 minuto.',
  },
})

// Login (público) con rate limiting estricto
router.post('/login', loginLimiter, configuracionController.login)
router.post('/refresh-token', refreshTokenLimiter, configuracionController.refreshToken)
router.post('/logout', configuracionController.logout)

// Proteger el resto de rutas
router.use(authenticate)

// Cambio de contraseña propio (cualquier usuario autenticado)
router.post('/change-password', changePasswordLimiter, configuracionController.changeOwnPassword)

// Usuarios (solo ADMIN)
router.get('/usuarios', authorize('ADMIN'), configuracionController.listUsuarios)
router.get('/usuarios/:id', authorize('ADMIN'), configuracionController.getUsuarioById)
router.post('/usuarios', authorize('ADMIN'), configuracionController.createUsuario)
router.put('/usuarios/:id', authorize('ADMIN'), configuracionController.updateUsuario)
router.put('/usuarios/:id/password', authorize('ADMIN'), configuracionController.updatePassword)
router.delete('/usuarios/:id', authorize('ADMIN'), configuracionController.deleteUsuario)

// Conceptos de Caja
router.get('/conceptos', configuracionController.listConceptos)
router.get('/conceptos/:id', configuracionController.getConceptoById)
router.post('/conceptos', authorize('ADMIN'), configuracionController.createConcepto)
router.put('/conceptos/:id', authorize('ADMIN'), configuracionController.updateConcepto)
router.delete('/conceptos/:id', authorize('ADMIN'), configuracionController.deleteConcepto)

// Organización
router.get('/organizacion', configuracionController.getOrganizacion)
router.put('/organizacion', authorize('ADMIN'), configuracionController.updateOrganizacion)

export default router
