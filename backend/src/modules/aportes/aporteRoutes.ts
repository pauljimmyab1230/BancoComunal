import { Router } from 'express'
import { aporteController } from './aporteController'
import { authorize } from '../../middleware/auth'

const router = Router()

router.get('/', aporteController.list)
router.get('/:id', aporteController.getById)
router.post('/', authorize('ADMIN', 'TESORERO'), aporteController.create)
router.put('/:id', authorize('ADMIN', 'TESORERO'), aporteController.update)
router.delete('/:id', authorize('ADMIN'), aporteController.delete)

export default router
