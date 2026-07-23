import { Request, Response, NextFunction } from 'express'
import { configuracionService } from './configuracionService'
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  usuarioPasswordSchema,
  loginSchema,
  conceptoCajaCreateSchema,
  conceptoCajaUpdateSchema,
  organizacionUpdateSchema,
} from './configuracionValidation'

export const configuracionController = {
  // ==================== USUARIOS ====================
  async listUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        estado: req.query.estado as string,
        rol: req.query.rol as string,
      }
      const data = await configuracionService.listUsuarios(params)
      res.json({ success: true, ...data })
    } catch (error) { next(error) }
  },

  async getUsuarioById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = await configuracionService.getUsuarioById(id)
      if (!data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async createUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const data = usuarioCreateSchema.parse(req.body)
      const usuario = await configuracionService.createUsuario(data)
      res.status(201).json({ success: true, data: usuario, message: 'Usuario creado correctamente' })
    } catch (error) { next(error) }
  },

  async updateUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = usuarioUpdateSchema.parse(req.body)
      const usuario = await configuracionService.updateUsuario(id, data)
      if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data: usuario, message: 'Usuario actualizado correctamente' })
    } catch (error) { next(error) }
  },

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const { password } = usuarioPasswordSchema.parse(req.body)
      const result = await configuracionService.updatePassword(id, password)
      if (!result) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data: result, message: 'Contraseña actualizada correctamente' })
    } catch (error) { next(error) }
  },

  async deleteUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const result = await configuracionService.deleteUsuario(id)
      if (!result) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, message: 'Usuario eliminado correctamente' })
    } catch (error) { next(error) }
  },

  // ==================== LOGIN ====================
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = loginSchema.parse(req.body)
      const result = await configuracionService.login(username, password)
      res.json({ success: true, data: result, message: 'Inicio de sesión exitoso' })
    } catch (error) { next(error) }
  },

  // ==================== CONCEPTOS DE CAJA ====================
  async listConceptos(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        estado: req.query.estado as string,
        tipo: req.query.tipo as string,
      }
      const data = await configuracionService.listConceptos(params)
      res.json({ success: true, ...data })
    } catch (error) { next(error) }
  },

  async getConceptoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = await configuracionService.getConceptoById(id)
      if (!data) return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async createConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = conceptoCajaCreateSchema.parse(req.body)
      const concepto = await configuracionService.createConcepto(data)
      res.status(201).json({ success: true, data: concepto, message: 'Concepto creado correctamente' })
    } catch (error) { next(error) }
  },

  async updateConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = conceptoCajaUpdateSchema.parse(req.body)
      const concepto = await configuracionService.updateConcepto(id, data)
      if (!concepto) return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, data: concepto, message: 'Concepto actualizado correctamente' })
    } catch (error) { next(error) }
  },

  async deleteConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const result = await configuracionService.deleteConcepto(id)
      if (!result) return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, message: 'Concepto eliminado correctamente' })
    } catch (error) { next(error) }
  },

  // ==================== ORGANIZACION ====================
  async getOrganizacion(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await configuracionService.getOrganizacion()
      res.json({ success: true, data })
    } catch (error) { next(error) }
  },

  async updateOrganizacion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = organizacionUpdateSchema.parse(req.body)
      const result = await configuracionService.updateOrganizacion(data)
      res.json({ success: true, data: result, message: 'Organización actualizada correctamente' })
    } catch (error) { next(error) }
  },
}
