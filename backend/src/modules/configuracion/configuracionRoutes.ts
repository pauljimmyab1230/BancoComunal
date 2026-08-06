import { Router } from 'express'
import { authenticate, authorize } from '../../middeware/auth'
import { configuracionController } from './configuracionController'

const router = Router()

// Login (público)
router.post('/login', configuracionController.login)

// Proteger el resto de rutas
router.use(authenticate)

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
