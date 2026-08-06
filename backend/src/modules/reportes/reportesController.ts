import { Request, Response, NextFunction } from 'express'
import { reportesService } from './reportesService'
import {
  estadoCuentasSocioSchema,
  carteraCreditosSchema,
  estadoResultadosSchema,
  reporteAportesSchema,
  morososSchema,
} from './reportesValidation'

export const reportesController = {
  async estadoCuentasSocio(req: Request, res: Response, next: NextFunction) {
    try {
      const params = estadoCuentasSocioSchema.parse(req.query)
      const data = await reportesService.estadoCuentasSocio(params)
      if (!data) return res.status(404).json({ success: false, message: 'Socio no encontrado' })
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async carteraCreditos(req: Request, res: Response, next: NextFunction) {
    try {
      const params = carteraCreditosSchema.parse(req.query)
      const data = await reportesService.carteraCreditos(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async estadoResultados(req: Request, res: Response, next: NextFunction) {
    try {
      const params = estadoResultadosSchema.parse(req.query)
      const data = await reportesService.estadoResultados(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async reporteAportes(req: Request, res: Response, next: NextFunction) {
    try {
      const params = reporteAportesSchema.parse(req.query)
      const data = await reportesService.reporteAportes(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async morosos(req: Request, res: Response, next: NextFunction) {
    try {
      const params = morososSchema.parse(req.query)
      const data = await reportesService.morosos(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async resumenEjecutivo(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportesService.resumenEjecutivo()
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },
}
