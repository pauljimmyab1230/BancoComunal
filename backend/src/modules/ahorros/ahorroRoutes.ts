import { Router } from 'express'
import { ahorroController } from './ahorroController'

const router = Router()

// Cuentas
router.get('/cuentas', ahorroController.listCuentas)
router.post('/cuentas', ahorroController.crearCuenta)
router.get('/cuentas/:id', ahorroController.getCuenta)
router.get('/cuentas/fondo/:fondoId/socio/:socioId', ahorroController.getCuentaPorFondoSocio)
router.put('/cuentas/:id/estado', ahorroController.actualizarEstado)

// Movimientos
router.get('/movimientos', ahorroController.listMovimientos)
router.post('/movimientos', ahorroController.crearMovimiento)

export default router
