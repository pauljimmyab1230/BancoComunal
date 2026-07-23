import { Router } from 'express'
import { reportesController } from './reportesController'

const router = Router()

router.get('/estado-cuentas-socio', reportesController.estadoCuentasSocio)
router.get('/cartera-creditos', reportesController.carteraCreditos)
router.get('/estado-resultados', reportesController.estadoResultados)
router.get('/aportes', reportesController.reporteAportes)
router.get('/morosos', reportesController.morosos)
router.get('/resumen-ejecutivo', reportesController.resumenEjecutivo)

export default router
