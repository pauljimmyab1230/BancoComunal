import { Request, Response, NextFunction } from 'express'
import { tesoreriaService } from './tesoreriaService'
import { 
  tesoreriaDashboardSchema, 
  conciliacionBancariaSchema, 
  transferenciaEntreCajasSchema, 
  reporteFlujoCajaSchema, 
  proyeccionFlujoSchema 
} from './tesoreriaValidation'

export const tesoreriaController = {
  async getResumenCaja(req: Request, res: Response, next: NextFunction) {
    try {
      const params = tesoreriaDashboardSchema.parse(req.query)
      const data = await tesoreriaService.getDashboard(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async getFlujoCaja(req: Request, res: Response, next: NextFunction) {
    try {
      const params = reporteFlujoCajaSchema.parse(req.query)
      const flujo = await tesoreriaService.getFlujoCaja(params)
      res.json({ success: true, data: flujo })
    } catch (error) { next(error) }
  },

  async conciliacionBancaria(req: Request, res: Response, next: NextFunction) {
    try {
      const data = conciliacionBancariaSchema.parse(req.body)
      const resultado = await tesoreriaService.conciliacionBancaria(data)
      res.json({ success: true, data: resultado, message: 'Conciliación realizada' })
    } catch (error) { next(error) }
  },

  async transferenciaEntreCajas(req: Request, res: Response, next: NextFunction) {
    try {
      const data = transferenciaEntreCajasSchema.parse(req.body)
      const registradorId = (req as any).user?.id || 1
      const resultado = await tesoreriaService.transferenciaEntreCajas(data, registradorId)
      res.json({ success: true, data: resultado, message: 'Transferencia realizada correctamente' })
    } catch (error) { next(error) }
  },

  async getProyeccionFlujo(req: Request, res: Response, next: NextFunction) {
    try {
      const params = proyeccionFlujoSchema.parse(req.query)
      const proyeccion = await tesoreriaService.getProyeccionFlujo(params)
      res.json({ success: true, data: proyeccion })
    } catch (error) { next(error) }
  },
}