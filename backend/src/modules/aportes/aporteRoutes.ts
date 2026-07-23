import { Router } from 'express'
import { aporteController } from './aporteController'

const router = Router()

router.get('/', aporteController.list)
router.get('/:id', aporteController.getById)
router.post('/', aporteController.create)
router.put('/:id', aporteController.update)
router.delete('/:id', aporteController.delete)

export default router
