import { Router } from 'express'
import { socioController } from './socioController'
import { upload } from '../../config/upload'

const router = Router()

// CRUD Socios
router.get('/', socioController.list)
router.get('/:id', socioController.getById)
router.post('/', upload.single('foto'), socioController.create)
router.put('/:id', upload.single('foto'), socioController.update)
router.delete('/:id', socioController.delete)

// Beneficiarios
router.get('/:socioId/beneficiarios', socioController.getBeneficiarios)
router.post('/:socioId/beneficiarios', socioController.addBeneficiario)
router.put('/:socioId/beneficiarios/:beneficiarioId', socioController.updateBeneficiario)
router.delete('/:socioId/beneficiarios/:beneficiarioId', socioController.deleteBeneficiario)

// Documentos
router.get('/:socioId/documentos', socioController.getDocumentos)
router.post('/:socioId/documentos', upload.single('documento'), socioController.uploadDocumento)
router.delete('/:socioId/documentos/:documentoId', socioController.deleteDocumento)

export default router
