import { Request, Response, NextFunction } from 'express'
import { cajaService } from './cajaService'
import { 
  createCajaSchema, updateCajaSchema,
  createConceptoCajaSchema, updateConceptoCajaSchema,
  createMovimientoSchema,
  createArqueoSchema, aprobarArqueoSchema, transferirSchema,
  createFlujoProyectadoSchema, updateFlujoProyectadoSchema,
  queryCajaSchema, queryArqueoSchema, queryFlujoSchema
} from './cajaValidation'

function safeParseInt(value: unknown): number | null {
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? null : parsed
}

export const cajaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const params = queryCajaSchema.parse(req.query)
      const result = await cajaService.list(params)
      res.json({ success: true, ...result })
    } catch (error) { next(error) }
  },

  async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const cajaId = safeParseInt(req.params.cajaId)
      if (cajaId === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const resumen = await cajaService.getResumenCaja(cajaId)
      if (!resumen) { res.status(404).json({ success: false, message: 'Caja no encontrada' }); return }
      res.json({ success: true, data: resumen })
    } catch (error) { next(error) }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const caja = await cajaService.getById(id)
      if (!caja) { res.status(404).json({ success: false, message: 'Caja no encontrada' }); return }
      res.json({ success: true, data: caja })
    } catch (error) { next(error) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCajaSchema.parse(req.body)
      const caja = await cajaService.create(data)
      res.status(201).json({ success: true, data: caja, message: 'Caja creada correctamente' })
    } catch (error) { next(error) }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = updateCajaSchema.parse(req.body)
      const caja = await cajaService.update(id, data)
      if (!caja) { res.status(404).json({ success: false, message: 'Caja no encontrada' }); return }
      res.json({ success: true, data: caja, message: 'Caja actualizada correctamente' })
    } catch (error) { next(error) }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const result = await cajaService.delete(id)
      if (result === false) { res.status(404).json({ success: false, message: 'Caja no encontrada' }); return }
      if (typeof result === 'string') { res.status(400).json({ success: false, message: result }); return }
      res.json({ success: true, message: 'Caja eliminada correctamente' })
    } catch (error) { next(error) }
  },

  // Conceptos
  async listConceptos(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, tipo } = req.query
      const conceptos = await cajaService.listConceptos({ estado: estado as string, tipo: tipo as string })
      res.json({ success: true, data: conceptos })
    } catch (error) { next(error) }
  },

  async createConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createConceptoCajaSchema.parse(req.body)
      const concepto = await cajaService.createConcepto(data)
      res.status(201).json({ success: true, data: concepto, message: 'Concepto creado correctamente' })
    } catch (error) { next(error) }
  },

  async updateConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = updateConceptoCajaSchema.parse(req.body)
      const concepto = await cajaService.updateConcepto(id, data)
      if (!concepto) { res.status(404).json({ success: false, message: 'Concepto no encontrado' }); return }
      res.json({ success: true, data: concepto, message: 'Concepto actualizado correctamente' })
    } catch (error) { next(error) }
  },

  async deleteConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const result = await cajaService.deleteConcepto(id)
      if (result === false) { res.status(404).json({ success: false, message: 'Concepto no encontrado' }); return }
      res.json({ success: true, message: 'Concepto eliminado correctamente' })
    } catch (error) { next(error) }
  },

  // Movimientos
  async listMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        cajaId: req.query.cajaId ? safeParseInt(req.query.cajaId) ?? undefined : undefined,
        conceptoId: req.query.conceptoId ? safeParseInt(req.query.conceptoId) ?? undefined : undefined,
        tipo: req.query.tipo as string,
        estado: req.query.estado as string,
        fechaInicio: req.query.fechaInicio as string,
        fechaFin: req.query.fechaFin as string,
        page: safeParseInt(req.query.page) ?? 1,
        limit: safeParseInt(req.query.limit) ?? 20,
      }
      const result = await cajaService.listMovimientos(params)
      res.json({ success: true, ...result })
    } catch (error) { next(error) }
  },

  async getMovimientoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const movimiento = await cajaService.getMovimientoById(id)
      if (!movimiento) { res.status(404).json({ success: false, message: 'Movimiento no encontrado' }); return }
      res.json({ success: true, data: movimiento })
    } catch (error) { next(error) }
  },

  async createMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createMovimientoSchema.parse(req.body)
      const movimiento = await cajaService.createMovimiento(data)
      res.status(201).json({ success: true, data: movimiento, message: 'Movimiento registrado correctamente' })
    } catch (error) { next(error) }
  },

  async anularMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      await cajaService.anularMovimiento(id)
      res.json({ success: true, message: 'Movimiento anulado correctamente' })
    } catch (error) { next(error) }
  },

  // Arqueos
  async listArqueos(req: Request, res: Response, next: NextFunction) {
    try {
      const params = queryArqueoSchema.parse(req.query)
      const result = await cajaService.listArqueos(params)
      res.json({ success: true, ...result })
    } catch (error) { next(error) }
  },

  async getArqueoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const arqueo = await cajaService.getArqueoById(id)
      if (!arqueo) { res.status(404).json({ success: false, message: 'Arqueo no encontrado' }); return }
      res.json({ success: true, data: arqueo })
    } catch (error) { next(error) }
  },

  async createArqueo(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createArqueoSchema.parse(req.body)
      const arqueo = await cajaService.createArqueo(data)
      res.status(201).json({ success: true, data: arqueo, message: 'Arqueo registrado correctamente' })
    } catch (error) { next(error) }
  },

  async aprobarArqueo(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = aprobarArqueoSchema.parse(req.body)
      const arqueo = await cajaService.aprobarArqueo(id, data, req.user?.username ?? null)
      res.json({ success: true, data: arqueo, message: `Arqueo ${data.estado.toLowerCase()} correctamente` })
    } catch (error) { next(error) }
  },

  async transferir(req: Request, res: Response, next: NextFunction) {
    try {
      const data = transferirSchema.parse(req.body)
      const result = await cajaService.transferir(data)
      res.json(result)
    } catch (error) { next(error) }
  },

  // Flujo Proyectado
  async listFlujoProyectado(req: Request, res: Response, next: NextFunction) {
    try {
      const params = queryFlujoSchema.parse(req.query)
      const data = await cajaService.listFlujoProyectado(params)
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async createFlujoProyectado(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFlujoProyectadoSchema.parse(req.body)
      const flujo = await cajaService.createFlujoProyectado(data)
      res.status(201).json({ success: true, data: flujo, message: 'Flujo proyectado creado correctamente' })
    } catch (error) { next(error) }
  },

  async updateFlujoProyectado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const data = updateFlujoProyectadoSchema.parse(req.body)
      const flujo = await cajaService.updateFlujoProyectado(id, data)
      if (!flujo) { res.status(404).json({ success: false, message: 'Flujo proyectado no encontrado' }); return }
      res.json({ success: true, data: flujo, message: 'Flujo proyectado actualizado correctamente' })
    } catch (error) { next(error) }
  },

  async deleteFlujoProyectado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = safeParseInt(req.params.id)
      if (id === null) { res.status(400).json({ success: false, message: 'ID inválido' }); return }
      const result = await cajaService.deleteFlujoProyectado(id)
      if (result === false) { res.status(404).json({ success: false, message: 'Flujo proyectado no encontrado' }); return }
      res.json({ success: true, message: 'Flujo proyectado eliminado correctamente' })
    } catch (error) { next(error) }
  },
}
