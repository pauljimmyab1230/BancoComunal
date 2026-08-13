import { Router } from 'express'
import { fondoController } from './fondoController'
import { authorize } from '../../middleware/auth'

const router = Router()

router.get('/', fondoController.list)
router.get('/:id', fondoController.getById)
router.post('/', authorize('ADMIN', 'TESORERO'), fondoController.create)
router.put('/:id', authorize('ADMIN', 'TESORERO'), fondoController.update)
router.delete('/:id', authorize('ADMIN'), fondoController.delete)

// Socios del fondo
router.get('/:id/socios', fondoController.getSocios)
router.post('/:id/socios', authorize('ADMIN', 'TESORERO'), fondoController.addSocio)
router.delete('/:id/socios/:socioId', authorize('ADMIN', 'TESORERO'), fondoController.removeSocio)

export default router
