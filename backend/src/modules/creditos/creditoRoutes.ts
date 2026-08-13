import { Router } from 'express'
import { creditoController } from './creditoController'
import { authorize } from '../../middleware/auth'

const router = Router()

router.get('/', creditoController.list)
router.post('/', authorize('ADMIN', 'TESORERO'), creditoController.crear)
router.get('/fondo/:fondoId/socio/:socioId', creditoController.getByFondoSocio)
router.post('/pagar', authorize('ADMIN', 'TESORERO'), creditoController.pagarCuota)
router.post('/liquidar', authorize('ADMIN', 'TESORERO'), creditoController.liquidar)
router.get('/:id', creditoController.getById)
router.put('/:id', authorize('ADMIN', 'TESORERO'), creditoController.actualizar)
router.put('/:id/anular', authorize('ADMIN'), creditoController.anular)

export default router
