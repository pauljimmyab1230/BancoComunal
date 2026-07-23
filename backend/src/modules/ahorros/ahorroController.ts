import { Request, Response, NextFunction } from 'express'
import { ahorroService } from './ahorroService'
import { createCuentaSchema, createMovimientoSchema } from './ahorroValidation'

function safeParseInt(value: unknown): number | null {
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

export const ahorroController = {
  async listCuentas(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page, limit, fondoId, socioId } = req.query
      const result = await ahorroService.listCuentas({
        search: search as string,
        page: safeParseInt(page) ?? undefined,
        limit: safeParseInt(limit) ?? undefined,
        fondoId: safeParseInt(fondoId) ?? undefined,
        socioId: safeParseInt(socioId) ?? undefined,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async getCuenta(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }

      const movPage = safeParseInt(req.query.movPage) ?? 1
      const movLimit = safeParseInt(req.query.movLimit) ?? 20

      const cuenta = await ahorroService.getCuenta(id, movPage, movLimit)
      if (!cuenta) {
        res.status(404).json({ success: false, message: 'Cuenta no encontrada' })
        return
      }
      res.json({ success: true, data: cuenta })
    } catch (error) {
      next(error)
    }
  },

  async crearCuenta(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCuentaSchema.parse(req.body)
      const cuenta = await ahorroService.crearCuenta(data)
      res.status(201).json({ success: true, data: cuenta, message: 'Cuenta de ahorro creada' })
    } catch (error) {
      next(error)
    }
  },

  async getCuentaPorFondoSocio(req: Request, res: Response, next: NextFunction) {
    try {
      const fondoId = safeParseInt(req.params.fondoId)
      const socioId = safeParseInt(req.params.socioId)
      if (fondoId === null || socioId === null) {
        res.status(400).json({ success: false, message: 'Parámetros inválidos' })
        return
      }
      const cuenta = await ahorroService.getCuentaByFondoYSocio(fondoId, socioId)
      if (!cuenta) {
        res.status(404).json({ success: false, message: 'Cuenta no encontrada' })
        return
      }
      res.json({ success: true, data: cuenta })
    } catch (error) {
      next(error)
    }
  },

  async actualizarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }

      const { estado } = req.body
      const cuenta = await ahorroService.actualizarEstado(id, estado)
      res.json({ success: true, data: cuenta, message: `Cuenta ${estado === 'ACTIVA' ? 'activada' : 'inactivada'} correctamente` })
    } catch (error) {
      next(error)
    }
  },

  async crearMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMovimientoSchema.parse(req.body)
      const movimiento = await ahorroService.crearMovimiento(data)
      res.status(201).json({ success: true, data: movimiento, message: 'Movimiento registrado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async listMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, cuentaId } = req.query
      const result = await ahorroService.listMovimientos({
        page: safeParseInt(page) ?? undefined,
        limit: safeParseInt(limit) ?? undefined,
        cuentaId: safeParseInt(cuentaId) ?? undefined,
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  },
}
