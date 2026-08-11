import { Router } from 'express'
import { reportesController } from './reportesController'

const router = Router()

router.get('/estado-cuentas-socio', reportesController.estadoCuentasSocio)
router.get('/cartera-creditos', reportesController.carteraCreditos)
router.get('/estado-resultados', reportesController.estadoResultados)
router.get('/aportes', reportesController.reporteAportes)
router.get('/morosos', reportesController.morosos)
router.get('/resumen-ejecutivo', reportesController.resumenEjecutivo)
router.get('/ficha-socio/pdf', reportesController.fichaSocioPdf)
router.get('/aportes-socio/pdf', reportesController.aportesSocioPdf)
router.get('/creditos-socio/pdf', reportesController.creditosSocioPdf)
router.get('/estado-cuenta-socio/pdf', reportesController.estadoCuentaSocioPdf)
router.get('/padron-fondo/pdf', reportesController.padronFondoPdf)
router.get('/resumen-fondo/pdf', reportesController.resumenFondoPdf)
router.get('/cronograma-cuotas/pdf', reportesController.cronogramaCuotasPdf)
router.get('/comprobante-aporte/pdf', reportesController.comprobanteAportePdf)
router.get('/aportes-fondo/pdf', reportesController.aportesFondoPdf)
router.get('/aportes-fondo/anios', reportesController.aportesFondoAnios)

export default router
