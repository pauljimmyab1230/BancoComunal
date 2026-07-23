import { Request, Response, NextFunction } from 'express'
import { auditoriaService } from './auditoriaService'
import { auditLogQuerySchema, auditLogSchema } from './auditoriaValidation'

export const auditoriaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = auditLogQuerySchema.parse(req.query)
      const data = await auditoriaService.list(params)
      res.json({ success: true, ...data })
    } catch (error) { next(error) }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = await auditoriaService.getById(id)
      if (!data) return res.status(404).json({ success: false, message: 'Registro de auditoría no encontrado' })
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async getModules(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await auditoriaService.getModules()
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await auditoriaService.getStats()
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = auditLogSchema.parse(req.body)
      const log = await auditoriaService.create(data)
      res.status(201).json({ success: true, data: log })
    } catch (error) { next(error) }
  },
}
