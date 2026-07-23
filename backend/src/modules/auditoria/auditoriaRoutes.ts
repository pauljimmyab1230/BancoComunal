import { Router } from 'express'
import { auditoriaController } from './auditoriaController'

const router = Router()

router.get('/stats', auditoriaController.getStats)
router.get('/modules', auditoriaController.getModules)
router.get('/', auditoriaController.list)
router.get('/:id', auditoriaController.getById)
router.post('/', auditoriaController.create)

export default router
