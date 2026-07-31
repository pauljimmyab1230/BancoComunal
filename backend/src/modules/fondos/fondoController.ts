import { Request, Response, NextFunction } from 'express'
import { fondoService } from './fondoService'
import { createFondoSchema, updateFondoSchema } from './fondoValidation'

function safeParseInt(val: unknown): number | null {
  const n = parseInt(String(val))
  return isNaN(n) ? null : n
}

export const fondoController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, estado } = req.query
      const result = await fondoService.list({
        search: search as string,
        page: safeParseInt(page) ?? undefined,
        limit: safeParseInt(limit) ?? undefined,
        estado: estado as string,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const fondo = await fondoService.getById(id)

      if (!fondo) {
        res.status(404).json({ success: false, message: 'Fondo no encontrado' })
        return
      }

      res.json({ success: true, data: fondo })
    } catch (error) {
      next(error)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFondoSchema.parse(req.body)
      const fondo = await fondoService.create(data)

      res.status(201).json({
        success: true,
        data: fondo,
        message: 'Fondo rotatorio creado correctamente',
      })
    } catch (error) {
      next(error)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const data = updateFondoSchema.parse(req.body)
      const fondo = await fondoService.update(id, data)

      if (!fondo) {
        res.status(404).json({ success: false, message: 'Fondo no encontrado' })
        return
      }

      res.json({
        success: true,
        data: fondo,
        message: 'Fondo actualizado correctamente',
      })
    } catch (error) {
      next(error)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id))
      const result = await fondoService.delete(id)

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message })
        return
      }

      res.json({ success: true, message: result.message })
    } catch (error) {
      next(error)
    }
  },

  // Socios del fondo
  async addSocio(req: Request, res: Response, next: NextFunction) {
    try {
      const fondoId = parseInt(String(req.params.id))
      const { socioId, ...rest } = req.body
      const result = await fondoService.addSocio(fondoId, parseInt(socioId), rest)

      if (!result) {
        res.status(404).json({ success: false, message: 'Fondo o socio no encontrado' })
        return
      }

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message })
        return
      }

      res.status(201).json({ success: true, data: result.data, message: 'Socio agregado al fondo' })
    } catch (error) {
      next(error)
    }
  },

  async removeSocio(req: Request, res: Response, next: NextFunction) {
    try {
      const fondoId = parseInt(String(req.params.id))
      const socioId = parseInt(String(req.params.socioId))
      const result = await fondoService.removeSocio(fondoId, socioId)

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message })
        return
      }

      res.json({ success: true, message: result.message })
    } catch (error) {
      next(error)
    }
  },

  async getSocios(req: Request, res: Response, next: NextFunction) {
    try {
      const fondoId = parseInt(String(req.params.id))
      const socios = await fondoService.getSocios(fondoId)
      res.json({ success: true, data: socios })
    } catch (error) {
      next(error)
    }
  },
}
