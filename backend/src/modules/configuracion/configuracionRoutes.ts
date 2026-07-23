import { Router } from 'express'
import { configuracionController } from './configuracionController'

const router = Router()

// Login
router.post('/login', configuracionController.login)

// Usuarios
router.get('/usuarios', configuracionController.listUsuarios)
router.get('/usuarios/:id', configuracionController.getUsuarioById)
router.post('/usuarios', configuracionController.createUsuario)
router.put('/usuarios/:id', configuracionController.updateUsuario)
router.put('/usuarios/:id/password', configuracionController.updatePassword)
router.delete('/usuarios/:id', configuracionController.deleteUsuario)

// Conceptos de Caja
router.get('/conceptos', configuracionController.listConceptos)
router.get('/conceptos/:id', configuracionController.getConceptoById)
router.post('/conceptos', configuracionController.createConcepto)
router.put('/conceptos/:id', configuracionController.updateConcepto)
router.delete('/conceptos/:id', configuracionController.deleteConcepto)

// Organización
router.get('/organizacion', configuracionController.getOrganizacion)
router.put('/organizacion', configuracionController.updateOrganizacion)

export default router
