import { Request, Response, NextFunction } from 'express'
import { configuracionService } from './configuracionService'
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  usuarioPasswordSchema,
  changeOwnPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  conceptoCajaCreateSchema,
  conceptoCajaUpdateSchema,
  organizacionUpdateSchema,
} from './configuracionValidation'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

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
    } catch (error) {
      next(error)
    }
  },

  async getUsuarioById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = await configuracionService.getUsuarioById(id)
      if (!data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  },

  async createUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const data = usuarioCreateSchema.parse(req.body)
      const usuario = await configuracionService.createUsuario(data, req.user?.userId, req.ip)
      res
        .status(201)
        .json({ success: true, data: usuario, message: 'Usuario creado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async updateUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = usuarioUpdateSchema.parse(req.body)
      const usuario = await configuracionService.updateUsuario(id, data, req.user?.userId, req.ip)
      if (!usuario)
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data: usuario, message: 'Usuario actualizado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const { password } = usuarioPasswordSchema.parse(req.body)
      const result = await configuracionService.updatePassword(
        id,
        password,
        req.user?.userId,
        req.ip
      )
      if (!result) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, data: result, message: 'Contraseña actualizada correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async changeOwnPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ success: false, message: 'No autenticado' })
      const { currentPassword, newPassword } = changeOwnPasswordSchema.parse(req.body)
      const result = await configuracionService.changeOwnPassword(
        userId,
        currentPassword,
        newPassword,
        req.ip
      )
      res.json({ success: true, data: result, message: 'Contraseña actualizada correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async deleteUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const result = await configuracionService.deleteUsuario(id, req.user?.userId, req.ip)
      if (!result) return res.status(404).json({ success: false, message: 'Usuario no encontrado' })
      res.json({ success: true, message: 'Usuario eliminado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  // ==================== LOGIN ====================
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = loginSchema.parse(req.body)
      const result = await configuracionService.login(username, password)

      // Establecer tokens como cookies httpOnly
      res.cookie('accessToken', result.token, { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 }) // 8 horas
      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }) // 7 días

      res.json({ success: true, data: result, message: 'Inicio de sesión exitoso' })
    } catch (error) {
      next(error)
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Intentar obtener refresh token de cookie o body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
      if (!refreshToken)
        return res.status(400).json({ success: false, message: 'Refresh token requerido' })

      // Validar formato del refresh token
      const validation = refreshTokenSchema.safeParse({ refreshToken })
      if (!validation.success) {
        return res.status(400).json({ success: false, message: 'Refresh token inválido' })
      }

      const result = await configuracionService.refreshToken(validation.data.refreshToken)

      // Establecer nuevos tokens como cookies httpOnly
      res.cookie('accessToken', result.token, { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 })
      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      res.json({ success: true, data: { user: result.user } })
    } catch (error) {
      next(error)
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = _req.cookies?.refreshToken
      await configuracionService.logout(refreshToken)

      // Limpiar cookies
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')

      res.json({ success: true, message: 'Sesión cerrada correctamente' })
    } catch (error) {
      next(error)
    }
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
    } catch (error) {
      next(error)
    }
  },

  async getConceptoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = await configuracionService.getConceptoById(id)
      if (!data) return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  },

  async createConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = conceptoCajaCreateSchema.parse(req.body)
      const concepto = await configuracionService.createConcepto(data)
      res
        .status(201)
        .json({ success: true, data: concepto, message: 'Concepto creado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async updateConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const data = conceptoCajaUpdateSchema.parse(req.body)
      const concepto = await configuracionService.updateConcepto(id, data)
      if (!concepto)
        return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, data: concepto, message: 'Concepto actualizado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  async deleteConcepto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const result = await configuracionService.deleteConcepto(id)
      if (!result)
        return res.status(404).json({ success: false, message: 'Concepto no encontrado' })
      res.json({ success: true, message: 'Concepto eliminado correctamente' })
    } catch (error) {
      next(error)
    }
  },

  // ==================== ORGANIZACION ====================
  async getOrganizacion(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await configuracionService.getOrganizacion()
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  },

  async updateOrganizacion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = organizacionUpdateSchema.parse(req.body)
      const result = await configuracionService.updateOrganizacion(data)
      res.json({ success: true, data: result, message: 'Organización actualizada correctamente' })
    } catch (error) {
      next(error)
    }
  },
}
