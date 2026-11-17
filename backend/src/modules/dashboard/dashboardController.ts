import { Request, Response, NextFunction } from 'express'
import { dashboardService } from './dashboardService'

export const dashboardController = {
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getSummary()
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  },

  async getEvolucion(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = Number(req.query.meses)
      const meses = Number.isFinite(raw) ? Math.min(24, Math.max(3, Math.trunc(raw))) : 12
      const data = await dashboardService.getEvolucion(meses)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  },
}
