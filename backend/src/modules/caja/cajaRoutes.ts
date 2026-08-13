import { Router } from 'express'
import { cajaController } from './cajaController'
import { authorize } from '../../middleware/auth'

const router = Router()

// Rutas fijas ANTES de /:id para evitar captura por Express
router.get('/', cajaController.list)
router.post('/', authorize('ADMIN', 'TESORERO'), cajaController.create)
router.get('/resumen/:cajaId', cajaController.getResumen)

// Transferencias entre cajas
router.post('/transferencias', authorize('ADMIN', 'TESORERO'), cajaController.transferir)

// Movimientos
router.get('/movimientos', cajaController.listMovimientos)
router.get('/movimientos/:id', cajaController.getMovimientoById)
router.post('/movimientos', authorize('ADMIN', 'TESORERO'), cajaController.createMovimiento)
router.post('/movimientos/:id/anular', authorize('ADMIN', 'TESORERO'), cajaController.anularMovimiento)

// Arqueos
router.get('/arqueos', cajaController.listArqueos)
router.get('/arqueos/:id', cajaController.getArqueoById)
router.post('/arqueos', authorize('ADMIN', 'TESORERO'), cajaController.createArqueo)
router.post('/arqueos/:id/aprobar', authorize('ADMIN', 'TESORERO'), cajaController.aprobarArqueo)

// Flujo Proyectado
router.get('/flujo-proyectado', cajaController.listFlujoProyectado)
router.post('/flujo-proyectado', authorize('ADMIN', 'TESORERO'), cajaController.createFlujoProyectado)
router.put('/flujo-proyectado/:id', authorize('ADMIN', 'TESORERO'), cajaController.updateFlujoProyectado)
router.delete('/flujo-proyectado/:id', authorize('ADMIN'), cajaController.deleteFlujoProyectado)

// /:id DESPUÉS de todas las rutas fijas
router.get('/:id', cajaController.getById)
router.put('/:id', authorize('ADMIN'), cajaController.update)
router.delete('/:id', authorize('ADMIN'), cajaController.delete)

export default router
