import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthPayload {
  userId: number
  username: string
  rol: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload
  }
}

const OPCIONES_VERIFICACION: jwt.VerifyOptions = { algorithms: ['HS256'] }

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Intentar obtener token de cookie o Authorization header
  const tokenFromCookie = req.cookies?.accessToken
  const authHeader = req.headers.authorization
  const token =
    tokenFromCookie || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)

  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, OPCIONES_VERIFICACION) as AuthPayload
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
  return null
}

export function authenticateUploads(req: Request, res: Response, next: NextFunction) {
  // Intentar obtener token de cookie o Authorization header
  const tokenFromCookie = req.cookies?.accessToken
  const authHeader = req.headers.authorization
  const token =
    tokenFromCookie || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)

  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' })
    return
  }

  try {
    jwt.verify(token, env.JWT_SECRET, OPCIONES_VERIFICACION)
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
