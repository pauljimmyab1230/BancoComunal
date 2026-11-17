import { Router } from 'express'
import { dashboardController } from './dashboardController'

const router = Router()

router.get('/summary', dashboardController.getSummary)
router.get('/evolucion', dashboardController.getEvolucion)

export default router
