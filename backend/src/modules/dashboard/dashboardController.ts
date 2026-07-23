import { Request, Response, NextFunction } from 'express'
import { dashboardService } from './dashboardService'

export const dashboardController = {
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getSummary()
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },
}
