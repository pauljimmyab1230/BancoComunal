import { Router } from 'express'
import { cajaController } from './cajaController'

const router = Router()

// Rutas fijas ANTES de /:id para evitar captura por Express
router.get('/', cajaController.list)
router.post('/', cajaController.create)
router.get('/resumen/:cajaId', cajaController.getResumen)

// Conceptos de Caja
router.get('/conceptos', cajaController.listConceptos)
router.post('/conceptos', cajaController.createConcepto)
router.put('/conceptos/:id', cajaController.updateConcepto)
router.delete('/conceptos/:id', cajaController.deleteConcepto)

// Movimientos
router.get('/movimientos', cajaController.listMovimientos)
router.get('/movimientos/:id', cajaController.getMovimientoById)
router.post('/movimientos', cajaController.createMovimiento)
router.post('/movimientos/:id/anular', cajaController.anularMovimiento)

// Arqueos
router.get('/arqueos', cajaController.listArqueos)
router.get('/arqueos/:id', cajaController.getArqueoById)
router.post('/arqueos', cajaController.createArqueo)
router.post('/arqueos/:id/aprobar', cajaController.aprobarArqueo)

// Flujo Proyectado
router.get('/flujo-proyectado', cajaController.listFlujoProyectado)
router.post('/flujo-proyectado', cajaController.createFlujoProyectado)
router.put('/flujo-proyectado/:id', cajaController.updateFlujoProyectado)
router.delete('/flujo-proyectado/:id', cajaController.deleteFlujoProyectado)

// /:id DESPUÉS de todas las rutas fijas
router.get('/:id', cajaController.getById)
router.put('/:id', cajaController.update)
router.delete('/:id', cajaController.delete)

export default router
