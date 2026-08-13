import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthPayload {
  userId: number
  username: string
  rol: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token requerido' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  if (typeof req.query?.token === 'string' && req.query.token) {
    return req.query.token
  }
  return null
}

export function authenticateUploads(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromRequest(req)
  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' })
    return
  }

  try {
    jwt.verify(token, env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado' })
      return
    }

    if (roles.length > 0 && !roles.includes(req.user.rol)) {
      res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' })
      return
    }

    next()
  }
}
