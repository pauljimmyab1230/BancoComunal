import { Router } from 'express'
import { cotizacionController } from './cotizacionController'
import { authorize } from '../../middleware/auth'

const router = Router()

router.get('/', cotizacionController.list)
router.post('/', authorize('ADMIN', 'TESORERO'), cotizacionController.crear)
router.get('/:id', cotizacionController.getById)
router.put('/:id', authorize('ADMIN', 'TESORERO'), cotizacionController.actualizar)
router.put('/:id/estado', authorize('ADMIN', 'TESORERO'), cotizacionController.cambiarEstado)
router.post('/:id/convertir', authorize('ADMIN', 'TESORERO'), cotizacionController.convertir)
router.delete('/:id', authorize('ADMIN'), cotizacionController.eliminar)

export default router
