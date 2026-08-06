import { Request, Response, NextFunction } from 'express'
import { aporteService } from './aporteService'
import { createAporteSchema, updateAporteSchema } from './aporteValidation'

function toInt(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : undefined
}

function parseId(req: Request, res: Response): number | undefined {
  const id = toInt(req.params.id)
  if (id === undefined) {
    res.status(400).json({ success: false, message: 'ID inválido' })
  }
  return id
}

export const aporteController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, estado, tipo, periodo } = req.query
      const result = await aporteService.list({
        search: search as string,
        page: toInt(req.query.page),
        limit: toInt(req.query.limit),
        estado: estado as string,
        tipo: tipo as string,
        periodo: periodo as string,
        fondoId: toInt(req.query.fondoId),
        socioId: toInt(req.query.socioId),
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req, res)
      if (id === undefined) return
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
      const id = parseId(req, res)
      if (id === undefined) return
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
      const id = parseId(req, res)
      if (id === undefined) return
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
