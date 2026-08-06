import { Request, Response, NextFunction } from 'express'
import { fondoService } from './fondoService'
import { createFondoSchema, updateFondoSchema, addSocioSchema } from './fondoValidation'

function safeParseInt(val: unknown): number | null {
  const n = parseInt(String(val))
  return isNaN(n) ? null : n
}

function parseId(val: unknown): number | null {
  const n = parseInt(String(val), 10)
  return Number.isInteger(n) && n > 0 ? n : null
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
      const id = parseId(req.params.id)
      if (!id) {
        res.status(400).json({ success: false, message: 'Id de fondo inválido' })
        return
      }
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
      const id = parseId(req.params.id)
      if (!id) {
        res.status(400).json({ success: false, message: 'Id de fondo inválido' })
        return
      }
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
      const id = parseId(req.params.id)
      if (!id) {
        res.status(400).json({ success: false, message: 'Id de fondo inválido' })
        return
      }
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
      if (isNaN(fondoId)) {
        res.status(400).json({ success: false, message: 'Id de fondo inválido' })
        return
      }
      const { socioId, ...rest } = addSocioSchema.parse(req.body)
      const result = await fondoService.addSocio(fondoId, socioId, rest)

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
      const fondoId = parseId(req.params.id)
      const socioId = parseId(req.params.socioId)
      if (!fondoId || !socioId) {
        res.status(400).json({ success: false, message: 'Id de fondo o socio inválido' })
        return
      }
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
      const fondoId = parseId(req.params.id)
      if (!fondoId) {
        res.status(400).json({ success: false, message: 'Id de fondo inválido' })
        return
      }
      const socios = await fondoService.getSocios(fondoId)
      res.json({ success: true, data: socios })
    } catch (error) {
      next(error)
    }
  },
}
