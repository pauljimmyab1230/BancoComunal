import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import { HttpError } from './httpError'

function isPrismaError(err: Error): err is Error & { code?: string; meta?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && 'code' in err
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message)

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    })
    return
  }

  if (err instanceof ZodError) {
    const issues = 'issues' in err ? (err as any).issues : 'errors' in err ? (err as any).errors : []
    res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Array.isArray(issues) ? issues.map((e: any) => ({
        campo: e.path?.join('.') || '',
        mensaje: e.message || '',
      })) : [],
    })
    return
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño máximo permitido' : `Error al subir archivo: ${err.message}`
    res.status(400).json({ success: false, message })
    return
  }

  if (err.message.includes('Tipo de archivo no permitido')) {
    res.status(400).json({
      success: false,
      message: err.message,
    })
    return
  }

  if (isPrismaError(err)) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'registro duplicado'
      res.status(409).json({
        success: false,
        message: `Ya existe un registro con el mismo valor (${target})`,
      })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'No se puede completar la operación porque el registro está relacionado con otros datos',
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'El registro solicitado no existe o ya fue eliminado',
      })
      return
    }
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  })
}
