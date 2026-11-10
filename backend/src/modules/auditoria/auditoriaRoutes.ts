import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import { auditoriaController } from './auditoriaController'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/stats', auditoriaController.getStats)
router.get('/modules', auditoriaController.getModules)
router.get('/', auditoriaController.list)
router.get('/:id', auditoriaController.getById)
router.post('/', auditoriaController.create)

export default router
