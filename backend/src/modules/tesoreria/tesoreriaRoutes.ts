import { Router } from 'express'
import { tesoreriaController } from './tesoreriaController'

const router = Router()

router.get('/resumen-caja', tesoreriaController.getResumenCaja)
router.get('/flujo-caja', tesoreriaController.getFlujoCaja)
router.post('/conciliacion-bancaria', tesoreriaController.conciliacionBancaria)
router.post('/transferencia', tesoreriaController.transferenciaEntreCajas)
router.get('/proyeccion-flujo', tesoreriaController.getProyeccionFlujo)

export default router