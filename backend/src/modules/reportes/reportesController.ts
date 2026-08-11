import { Request, Response, NextFunction } from 'express'
import { reportesService } from './reportesService'
import { fichaPdfService } from './fichaPdfService'
import { aportesPdfService } from './aportesPdfService'
import { creditosPdfService } from './creditosPdfService'
import { estadoCuentaPdfService } from './estadoCuentaPdfService'
import { padronFondoPdfService } from './padronFondoPdfService'
import { resumenFondoPdfService } from './resumenFondoPdfService'
import { cronogramaCuotasPdfService } from './cronogramaCuotasPdfService'
import { comprobanteAportePdfService } from './comprobanteAportePdfService'
import { aportesFondoPdfService } from './aportesFondoPdfService'
import {
  estadoCuentasSocioSchema,
  carteraCreditosSchema,
  estadoResultadosSchema,
  reporteAportesSchema,
  morososSchema,
  fichaSocioPdfSchema,
  aportesSocioPdfSchema,
  creditosSocioPdfSchema,
  estadoCuentaPdfSchema,
  padronFondoPdfSchema,
  resumenFondoPdfSchema,
  cronogramaCuotasPdfSchema,
  comprobanteAportePdfSchema,
  aportesFondoPdfSchema,
  aportesFondoAniosSchema,
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

  async fichaSocioPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { socioId, fondoId } = fichaSocioPdfSchema.parse(req.query)
      const pdf = await fichaPdfService.generate(socioId, fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="ficha-socio-${socioId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async aportesSocioPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { socioId, fondoId } = aportesSocioPdfSchema.parse(req.query)
      const pdf = await aportesPdfService.generate(socioId, fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="historial-aportes-${socioId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async creditosSocioPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { socioId, fondoId } = creditosSocioPdfSchema.parse(req.query)
      const pdf = await creditosPdfService.generate(socioId, fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="historial-creditos-${socioId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async estadoCuentaSocioPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { socioId, fondoId } = estadoCuentaPdfSchema.parse(req.query)
      const pdf = await estadoCuentaPdfService.generate(socioId, fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="estado-cuenta-${socioId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async padronFondoPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { fondoId } = padronFondoPdfSchema.parse(req.query)
      const pdf = await padronFondoPdfService.generate(fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="padron-socios-${fondoId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async resumenFondoPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { fondoId } = resumenFondoPdfSchema.parse(req.query)
      const pdf = await resumenFondoPdfService.generate(fondoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="resumen-fondo-${fondoId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async cronogramaCuotasPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { prestamoId } = cronogramaCuotasPdfSchema.parse(req.query)
      const pdf = await cronogramaCuotasPdfService.generate(prestamoId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="cronograma-cuotas-${prestamoId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async comprobanteAportePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { aporteId } = comprobanteAportePdfSchema.parse(req.query)
      const pdf = await comprobanteAportePdfService.generate(aporteId)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="comprobante-ingreso-${aporteId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async aportesFondoPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { fondoId, anio } = aportesFondoPdfSchema.parse(req.query)
      const pdf = await aportesFondoPdfService.generate(fondoId, anio)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="historial-aportes-fondo-${fondoId}.pdf"`)
      res.setHeader('Content-Length', pdf.length)
      res.end(pdf)
    } catch (error) { next(error) }
  },

  async aportesFondoAnios(req: Request, res: Response, next: NextFunction) {
    try {
      const { fondoId } = aportesFondoAniosSchema.parse(req.query)
      const anios = await aportesFondoPdfService.anios(fondoId)
      res.json({ success: true, data: anios })
    } catch (error) { next(error) }
  },
}
