import { Router } from 'express'
import { fondoController } from './fondoController'

const router = Router()

router.get('/', fondoController.list)
router.get('/:id', fondoController.getById)
router.post('/', fondoController.create)
router.put('/:id', fondoController.update)
router.delete('/:id', fondoController.delete)

// Socios del fondo
router.get('/:id/socios', fondoController.getSocios)
router.post('/:id/socios', fondoController.addSocio)
router.delete('/:id/socios/:socioId', fondoController.removeSocio)

export default router
