import { Router } from 'express'
import { creditoController } from './creditoController'

const router = Router()

router.get('/', creditoController.list)
router.post('/', creditoController.crear)
router.get('/fondo/:fondoId/socio/:socioId', creditoController.getByFondoSocio)
router.post('/pagar', creditoController.pagarCuota)
router.get('/:id', creditoController.getById)
router.put('/:id/anular', creditoController.anular)

export default router
