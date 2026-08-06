import { Request, Response, NextFunction } from 'express'
import { socioService } from './socioService'
import { createSocioSchema, updateSocioSchema, createBeneficiarioSchema, tipoDocumentoEnum } from './socioValidation'
import { getFullUrl } from '../../config/urlHelper'

function safeParseInt(val: unknown): number | null {
  const n = parseInt(String(val))
  return isNaN(n) ? null : n
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return null
}

export const socioController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, estado } = req.query
      const result = await socioService.list({
        search: search as string,
        page: safeParseInt(page) ?? undefined,
        limit: safeParseInt(limit) ?? undefined,
        estado: estado as string,
      })
      res.json({
        ...result,
        data: result.data.map((s: any) => ({
          ...s,
          fotoUrl: getFullUrl(req, s.fotoUrl, extractToken(req)),
        })),
      })
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (!id) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const socio = await socioService.getById(id)

      if (!socio) {
        res.status(404).json({ success: false, message: 'Socio no encontrado' })
        return
      }

      res.json({
        success: true,
        data: {
          ...socio,
          fotoUrl: getFullUrl(req, socio.fotoUrl, extractToken(req)),
          documentos: socio.documentos?.map((d: any) => ({
            ...d,
            rutaArchivo: getFullUrl(req, d.rutaArchivo, extractToken(req)),
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSocioSchema.parse(req.body)
      const fotoFile = req.file
      const socio = await socioService.create(data, fotoFile)

      res.status(201).json({
        success: true,
        data: socio,
        message: 'Socio registrado correctamente',
      })
    } catch (error: any) {
      if (error.message?.includes('DNI ya está registrado') || error.message?.includes('mayor de 18')) {
        res.status(400).json({ success: false, message: error.message })
        return
      }
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (!id) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = updateSocioSchema.parse(req.body)
      const fotoFile = req.file
      const socio = await socioService.update(id, data, fotoFile)

      if (!socio) {
        res.status(404).json({ success: false, message: 'Socio no encontrado' })
        return
      }

      res.json({
        success: true,
        data: socio,
        message: 'Socio actualizado correctamente',
      })
    } catch (error: any) {
      if (error.message?.includes('DNI ya está registrado') || error.message?.includes('mayor de 18')) {
        res.status(400).json({ success: false, message: error.message })
        return
      }
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (!id) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const result = await socioService.delete(id)

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message })
        return
      }

      res.json({ success: true, message: result.message })
    } catch (error) {
      next(error)
    }
  },

  // Beneficiarios
  async getBeneficiarios(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const beneficiarios = await socioService.getBeneficiarios(socioId)
      res.json({ success: true, data: beneficiarios })
    } catch (error) {
      next(error)
    }
  },

  async addBeneficiario(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = createBeneficiarioSchema.parse(req.body)
      const beneficiario = await socioService.addBeneficiario(socioId, data)

      if (!beneficiario) {
        res.status(404).json({ success: false, message: 'Socio no encontrado' })
        return
      }

      res.status(201).json({ success: true, data: beneficiario, message: 'Beneficiario agregado' })
    } catch (error) {
      next(error)
    }
  },

  async updateBeneficiario(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const beneficiarioId = safeParseInt(req.params.beneficiarioId)
      if (!beneficiarioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = createBeneficiarioSchema.partial().parse(req.body)
      const beneficiario = await socioService.updateBeneficiario(socioId, beneficiarioId, data)

      if (!beneficiario) {
        res.status(404).json({ success: false, message: 'Beneficiario no encontrado' })
        return
      }

      res.json({ success: true, data: beneficiario, message: 'Beneficiario actualizado' })
    } catch (error) {
      next(error)
    }
  },

  async deleteBeneficiario(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const beneficiarioId = safeParseInt(req.params.beneficiarioId)
      if (!beneficiarioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const deleted = await socioService.deleteBeneficiario(socioId, beneficiarioId)

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Beneficiario no encontrado' })
        return
      }

      res.json({ success: true, message: 'Beneficiario eliminado' })
    } catch (error) {
      next(error)
    }
  },

  // Documentos
  async getDocumentos(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const documentos = await socioService.getDocumentos(socioId)
      res.json({ success: true, data: documentos })
    } catch (error) {
      next(error)
    }
  },

  async uploadDocumento(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const file = req.file
      const tipoDocumentoResult = tipoDocumentoEnum.safeParse(req.body.tipoDocumento || 'OTRO')
      const tipoDocumento = tipoDocumentoResult.success ? tipoDocumentoResult.data : 'OTRO'

      if (!file) {
        res.status(400).json({ success: false, message: 'Archivo requerido' })
        return
      }

      const doc = await socioService.uploadDocumento(socioId, file, tipoDocumento)

      if (!doc) {
        res.status(404).json({ success: false, message: 'Socio no encontrado' })
        return
      }

      res.status(201).json({ success: true, data: doc, message: 'Documento subido' })
    } catch (error) {
      next(error)
    }
  },

  async deleteDocumento(req: Request, res: Response, next: NextFunction) {
    try {
      const socioId = safeParseInt(req.params.socioId)
      if (!socioId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const documentoId = safeParseInt(req.params.documentoId)
      if (!documentoId) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const deleted = await socioService.deleteDocumento(socioId, documentoId)

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Documento no encontrado' })
        return
      }

      res.json({ success: true, message: 'Documento eliminado' })
    } catch (error) {
      next(error)
    }
  },
}
