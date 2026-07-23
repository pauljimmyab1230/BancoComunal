import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message)

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

  if (err.message.includes('Tipo de archivo no permitido')) {
    res.status(400).json({
      success: false,
      message: err.message,
    })
    return
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  })
}
