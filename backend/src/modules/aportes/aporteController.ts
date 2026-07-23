import { Request, Response, NextFunction } from 'express'
import { aporteService } from './aporteService'
import { createAporteSchema, updateAporteSchema } from './aporteValidation'

export const aporteController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, estado, fondoId, socioId } = req.query
      const result = await aporteService.list({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        estado: estado as string,
        fondoId: fondoId ? parseInt(fondoId as string) : undefined,
        socioId: socioId ? parseInt(socioId as string) : undefined,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const aporte = await aporteService.getById(id)
      if (!aporte) {
        res.status(404).json({ success: false, message: 'Aporte no encontrado' })
        return
      }
      res.json({ success: true, data: aporte })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAporteSchema.parse(req.body)
      const aporte = await aporteService.create(data)
      res.status(201).json({
        success: true,
        data: aporte,
        message: 'Aporte registrado correctamente',
      })
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const data = updateAporteSchema.parse(req.body)
      const aporte = await aporteService.update(id, data)
      if (!aporte) {
        res.status(404).json({ success: false, message: 'Aporte no encontrado' })
        return
      }
      res.json({ success: true, data: aporte, message: 'Aporte actualizado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const result = await aporteService.delete(id)
      if (!result.success) {
        res.status(400).json({ success: false, message: result.message })
        return
      }
      res.json({ success: true, message: result.message })
    } catch (error) {
      next(error)
    }
  },
}
