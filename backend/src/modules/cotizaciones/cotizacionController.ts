import { Request, Response, NextFunction } from 'express'
import { cotizacionService } from './cotizacionService'
import {
  createCotizacionSchema,
  updateCotizacionSchema,
  cambiarEstadoSchema,
} from './cotizacionValidation'
import { toInt } from '../../middleware/parseHelpers'

export const cotizacionController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, estado } = req.query
      const result = await cotizacionService.list({
        search: search as string,
        page: toInt(page) ?? undefined,
        limit: toInt(limit) ?? undefined,
        estado: estado as string,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toInt(req.params.id)
      if (id === undefined) {
        res.status(400).json({ success: false, message: 'ID inválido' })
        return
      }

      const cotizacion = await cotizacionService.getById(id)
      if (!cotizacion) {
        res.status(404).json({ success: false, message: 'Cotización no encontrada' })
        return
      }
      res.json({ success: true, data: cotizacion })
    } catch (error) {
      next(error)
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCotizacionSchema.parse(req.body)
      const cotizacion = await cotizacionService.create(data, req.user?.userId)
      res
        .status(201)
        .json({ success: true, data: cotizacion, message: 'Cotización creada correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toInt(req.params.id)
      if (id === undefined) {
        res.status(400).json({ success: false, message: 'ID inválido' })
        return
      }

      const data = updateCotizacionSchema.parse(req.body)
      const cotizacion = await cotizacionService.update(id, data, req.user?.userId)
      res.json({
        success: true,
        data: cotizacion,
        message: 'Cotización actualizada correctamente',
      })
    } catch (error) {
      next(error)
    }
  },

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toInt(req.params.id)
      if (id === undefined) {
        res.status(400).json({ success: false, message: 'ID inválido' })
        return
      }

      const { estado } = cambiarEstadoSchema.parse(req.body)
      const cotizacion = await cotizacionService.cambiarEstado(id, estado, req.user?.userId)
      res.json({
        success: true,
        data: cotizacion,
        message: `Cotización marcada como ${estado.toLowerCase()}`,
      })
    } catch (error) {
      next(error)
    }
  },

  async convertir(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toInt(req.params.id)
      if (id === undefined) {
        res.status(400).json({ success: false, message: 'ID inválido' })
        return
      }

      const result = await cotizacionService.convertir(id, req.user?.userId)
      res.status(201).json({
        success: true,
        data: result,
        message: 'Cotización convertida en crédito correctamente',
      })
    } catch (error) {
      next(error)
    }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = toInt(req.params.id)
      if (id === undefined) {
        res.status(400).json({ success: false, message: 'ID inválido' })
        return
      }

      const result = await cotizacionService.delete(id, req.user?.userId)
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
