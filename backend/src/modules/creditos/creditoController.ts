import { Request, Response, NextFunction } from 'express'
import { creditoService } from './creditoService'
import { createPrestamoSchema, updatePrestamoSchema, pagoCuotaSchema, liquidarSchema } from './creditoValidation'

function safeParseInt(value: unknown): number | null {
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

export const creditoController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, fondoId, socioId, estado } = req.query
      const result = await creditoService.list({
        search: search as string,
        page: safeParseInt(page) ?? undefined,
        limit: safeParseInt(limit) ?? undefined,
        fondoId: safeParseInt(fondoId) ?? undefined,
        socioId: safeParseInt(socioId) ?? undefined,
        estado: estado as string,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }

      const prestamo = await creditoService.getById(id)
      if (!prestamo) {
        res.status(404).json({ success: false, message: 'Préstamo no encontrado' })
        return
      }
      res.json({ success: true, data: prestamo })
    } catch (error) {
      next(error)
    }
  },

  async getByFondoSocio(req: Request, res: Response, next: NextFunction) {
    try {
      const fondoId = safeParseInt(req.params.fondoId)
      const socioId = safeParseInt(req.params.socioId)
      if (fondoId === null || socioId === null) {
        res.status(400).json({ success: false, message: 'Parámetros inválidos' })
        return
      }
      const prestamos = await creditoService.getByFondoSocio(fondoId, socioId)
      res.json({ success: true, data: prestamos })
    } catch (error) {
      next(error)
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPrestamoSchema.parse(req.body)
      const prestamo = await creditoService.crear(data)
      res.status(201).json({ success: true, data: prestamo, message: 'Préstamo creado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }

      const data = updatePrestamoSchema.parse(req.body)
      const prestamo = await creditoService.actualizar(id, data)
      res.json({ success: true, data: prestamo, message: 'Préstamo actualizado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async pagarCuota(req: Request, res: Response, next: NextFunction) {
    try {
      const data = pagoCuotaSchema.parse(req.body)
      const result = await creditoService.pagarCuota(data)
      res.json({ success: true, data: result, message: 'Pago registrado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async liquidar(req: Request, res: Response, next: NextFunction) {
    try {
      const { prestamoId, ...data } = liquidarSchema.parse(req.body)
      const result = await creditoService.liquidar(prestamoId, data)
      res.json({ success: true, data: result, message: 'Préstamo liquidado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }

      const result = await creditoService.anular(id)
      res.json({ success: true, message: 'Préstamo anulado correctamente' })
    } catch (error) {
      next(error)
    }
  },
}
