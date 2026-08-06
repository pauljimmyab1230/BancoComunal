import { Router } from 'express'
import { socioController } from './socioController'
import { upload } from '../../config/upload'
import { authorize } from '../../middeware/auth'

const router = Router()

// CRUD Socios
router.get('/', socioController.list)
router.get('/:id', socioController.getById)
router.post('/', authorize('ADMIN', 'TESORERO'), upload.single('foto'), socioController.create)
router.put('/:id', authorize('ADMIN', 'TESORERO'), upload.single('foto'), socioController.update)
router.delete('/:id', authorize('ADMIN'), socioController.delete)

// Beneficiarios
router.get('/:socioId/beneficiarios', socioController.getBeneficiarios)
router.post('/:socioId/beneficiarios', authorize('ADMIN', 'TESORERO'), socioController.addBeneficiario)
router.put('/:socioId/beneficiarios/:beneficiarioId', authorize('ADMIN', 'TESORERO'), socioController.updateBeneficiario)
router.delete('/:socioId/beneficiarios/:beneficiarioId', authorize('ADMIN', 'TESORERO'), socioController.deleteBeneficiario)

// Documentos
router.get('/:socioId/documentos', socioController.getDocumentos)
router.post('/:socioId/documentos', authorize('ADMIN', 'TESORERO'), upload.single('documento'), socioController.uploadDocumento)
router.delete('/:socioId/documentos/:documentoId', authorize('ADMIN', 'TESORERO'), socioController.deleteDocumento)

export default router
