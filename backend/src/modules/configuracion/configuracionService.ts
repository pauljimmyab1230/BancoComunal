import prisma from '../../config/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { HttpError } from '../../middleware/httpError'
import { createAuditLog } from '../../config/auditLog'
import { cajaService } from '../caja/cajaService'
import { z } from 'zod'
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  conceptoCajaCreateSchema,
  conceptoCajaUpdateSchema,
  organizacionUpdateSchema,
} from './configuracionValidation'
import type { Prisma } from '@prisma/client'

function hashearToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const configuracionService = {
  // ==================== USUARIOS ====================
  async listUsuarios(params: {
    search?: string
    page?: number
    limit?: number
    estado?: string
    rol?: string
  }) {
    const { search, page = 1, limit = 10, estado, rol } = params
    const skip = (page - 1) * limit

    const where: Prisma.UsuarioWhereInput = {}
    if (estado) where.estado = estado
    if (rol) where.rol = rol
    if (search) {
      where.OR = [
        { nombres: { contains: search } },
        { apellidoPaterno: { contains: search } },
        { username: { contains: search } },
        { correo: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          username: true,
          correo: true,
          telefono: true,
          rol: true,
          estado: true,
          ultimoAcceso: true,
          createdAt: true,
        },
      }),
      prisma.usuario.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getUsuarioById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        username: true,
        correo: true,
        telefono: true,
        rol: true,
        estado: true,
        ultimoAcceso: true,
        createdAt: true,
      },
    })
  },

  async createUsuario(data: z.infer<typeof usuarioCreateSchema>, usuarioId?: number, ip?: string) {
    const existing = await prisma.usuario.findUnique({ where: { username: data.username } })
    if (existing) throw new HttpError(400, 'El nombre de usuario ya existe')

    if (data.correo) {
      const existingEmail = await prisma.usuario.findUnique({ where: { correo: data.correo } })
      if (existingEmail) throw new HttpError(400, 'El correo ya está registrado')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const usuario = await prisma.usuario.create({
      data: {
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        username: data.username,
        password: hashedPassword,
        correo: data.correo || null,
        telefono: data.telefono || null,
        rol: data.rol,
        estado: data.estado || 'ACTIVO',
      },
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        username: true,
        correo: true,
        telefono: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      tabla: 'Usuario',
      registroId: usuario.id,
      operacion: 'CREATE',
      datosNuevos: { username: usuario.username, rol: usuario.rol, estado: usuario.estado },
      usuarioId,
      ip,
    })

    return usuario
  },

  async updateUsuario(
    id: number,
    data: z.infer<typeof usuarioUpdateSchema>,
    usuarioId?: number,
    ip?: string
  ) {
    const existing = await prisma.usuario.findUnique({ where: { id } })
    if (!existing) return null

    if (data.username && data.username !== existing.username) {
      const dup = await prisma.usuario.findUnique({ where: { username: data.username } })
      if (dup) throw new HttpError(400, 'El nombre de usuario ya existe')
    }

    if (data.correo && data.correo !== existing.correo) {
      const dup = await prisma.usuario.findUnique({ where: { correo: data.correo } })
      if (dup) throw new HttpError(400, 'El correo ya está registrado')
    }

    const updateData: Prisma.UsuarioUpdateInput = {}
    if (data.nombres !== undefined) updateData.nombres = data.nombres
    if (data.apellidoPaterno !== undefined) updateData.apellidoPaterno = data.apellidoPaterno
    if (data.apellidoMaterno !== undefined) updateData.apellidoMaterno = data.apellidoMaterno
    if (data.username !== undefined) updateData.username = data.username
    if (data.correo !== undefined) updateData.correo = data.correo || null
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null
    if (data.rol !== undefined) updateData.rol = data.rol
    if (data.estado !== undefined) updateData.estado = data.estado

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        username: true,
        correo: true,
        telefono: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    })

    if (data.estado === 'INACTIVO') {
      await configuracionService.logoutAll(id)
    }

    await createAuditLog({
      tabla: 'Usuario',
      registroId: usuario.id,
      operacion: 'UPDATE',
      datosAnteriores: { username: existing.username, rol: existing.rol, estado: existing.estado },
      datosNuevos: { username: usuario.username, rol: usuario.rol, estado: usuario.estado },
      usuarioId,
      ip,
    })

    return usuario
  },

  async updatePassword(id: number, newPassword: string, usuarioId?: number, ip?: string) {
    const existing = await prisma.usuario.findUnique({ where: { id } })
    if (!existing) return null

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, username: true },
    })

    await configuracionService.logoutAll(id)

    await createAuditLog({
      tabla: 'Usuario',
      registroId: id,
      operacion: 'UPDATE',
      datosNuevos: { passwordActualizada: true },
      usuarioId,
      ip,
    })

    return usuario
  },

  async changeOwnPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    ip?: string
  ) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
    if (!usuario) throw new HttpError(404, 'Usuario no encontrado')

    const validPassword = await bcrypt.compare(currentPassword, usuario.password)
    if (!validPassword) throw new HttpError(400, 'La contraseña actual es incorrecta')

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword, cambiarPassword: false },
    })

    await configuracionService.logoutAll(userId)

    await createAuditLog({
      tabla: 'Usuario',
      registroId: userId,
      operacion: 'UPDATE',
      datosNuevos: { passwordActualizada: true },
      usuarioId: userId,
      ip,
    })

    return { id: usuario.id, username: usuario.username }
  },

  async deleteUsuario(id: number, usuarioId?: number, ip?: string) {
    const existing = await prisma.usuario.findUnique({ where: { id } })
    if (!existing) return false
    if (existing.username === 'admin')
      throw new HttpError(400, 'No se puede eliminar el usuario admin')
    await prisma.usuario.delete({ where: { id } })

    await createAuditLog({
      tabla: 'Usuario',
      registroId: id,
      operacion: 'DELETE',
      datosAnteriores: { username: existing.username, rol: existing.rol, estado: existing.estado },
      usuarioId,
      ip,
    })

    return true
  },

  // ==================== LOGIN ====================
  async login(username: string, password: string) {
    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario) throw new HttpError(400, 'Usuario o contraseña incorrectos')

    // Verificar si la cuenta está bloqueada
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000)
      throw new HttpError(
        423,
        `Cuenta bloqueada temporalmente. Intente de nuevo en ${minutosRestantes} minuto(s).`
      )
    }

    if (usuario.estado !== 'ACTIVO') throw new HttpError(400, 'La cuenta está desactivada')

    const validPassword = await bcrypt.compare(password, usuario.password)
    if (!validPassword) {
      // Incrementar intentos fallidos
      const intentosFallidos = usuario.intentosFallidos + 1
      const updateData: { intentosFallidos: number; bloqueadoHasta?: Date } = { intentosFallidos }

      // Bloquear después de 5 intentos fallidos por 15 minutos
      if (intentosFallidos >= 5) {
        updateData.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000)
      }

      await prisma.usuario.update({ where: { id: usuario.id }, data: updateData })
      throw new HttpError(400, 'Usuario o contraseña incorrectos')
    }

    // Login exitoso: resetear intentos fallidos y actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date(), intentosFallidos: 0, bloqueadoHasta: null },
    })

    const token = jwt.sign(
      { userId: usuario.id, username: usuario.username, rol: usuario.rol },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    )

    const refreshToken = jwt.sign({ userId: usuario.id, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    })

    // Almacenar refresh token en la base de datos (solo su hash SHA-256)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: {
        token: hashearToken(refreshToken),
        usuarioId: usuario.id,
        expiresAt,
      },
    })

    return {
      token,
      refreshToken,
      user: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidoPaterno: usuario.apellidoPaterno,
        username: usuario.username,
        correo: usuario.correo,
        rol: usuario.rol,
        cambiarPassword: usuario.cambiarPassword,
      },
    }
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as { userId: number; type: string }
      if (decoded.type !== 'refresh') throw new HttpError(401, 'Token inválido')

      // Verificar que el token existe en la base de datos (por hash) y no ha sido revocado
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: hashearToken(refreshToken) },
      })
      if (!storedToken) throw new HttpError(401, 'Token revocado o no válido')
      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } })
        throw new HttpError(401, 'Token expirado')
      }

      const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } })
      if (!usuario) throw new HttpError(401, 'Usuario no encontrado')
      if (usuario.estado !== 'ACTIVO') throw new HttpError(401, 'Cuenta desactivada')

      // Rotar refresh token: eliminar el viejo y crear uno nuevo
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })

      const token = jwt.sign(
        { userId: usuario.id, username: usuario.username, rol: usuario.rol },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
      )

      const newRefreshToken = jwt.sign(
        { userId: usuario.id, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await prisma.refreshToken.create({
        data: {
          token: hashearToken(newRefreshToken),
          usuarioId: usuario.id,
          expiresAt,
        },
      })

      return {
        token,
        refreshToken: newRefreshToken,
        user: {
          id: usuario.id,
          nombres: usuario.nombres,
          apellidoPaterno: usuario.apellidoPaterno,
          username: usuario.username,
          correo: usuario.correo,
          rol: usuario.rol,
          cambiarPassword: usuario.cambiarPassword,
        },
      }
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(401, 'Refresh token inválido o expirado')
    }
  },

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: hashearToken(refreshToken) } })
    }
  },

  async logoutAll(usuarioId: number) {
    await prisma.refreshToken.deleteMany({ where: { usuarioId } })
  },

  // ==================== CONCEPTOS DE CAJA ====================
  // Las mutaciones delegan al servicio de caja para aplicar las validaciones estrictas
  // (no editar/eliminar conceptos con movimientos, 404s, etc.) y evitar dos fuentes de verdad.

  async listConceptos(params: {
    search?: string
    page?: number
    limit?: number
    estado?: string
    tipo?: string
  }) {
    const { search, page = 1, limit = 20, estado, tipo } = params
    const skip = (page - 1) * limit

    const where: Prisma.ConceptoCajaWhereInput = {}
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (search) {
      where.OR = [{ codigo: { contains: search } }, { nombre: { contains: search } }]
    }

    const [data, total] = await Promise.all([
      prisma.conceptoCaja.findMany({ where, skip, take: limit, orderBy: { orden: 'asc' } }),
      prisma.conceptoCaja.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getConceptoById(id: number) {
    return cajaService.getConceptoById(id)
  },

  async createConcepto(data: z.infer<typeof conceptoCajaCreateSchema>) {
    const existing = await prisma.conceptoCaja.findUnique({ where: { codigo: data.codigo } })
    if (existing) throw new HttpError(400, 'El código del concepto ya existe')
    return cajaService.createConcepto(data)
  },

  async updateConcepto(id: number, data: z.infer<typeof conceptoCajaUpdateSchema>) {
    return cajaService.updateConcepto(id, data)
  },

  async deleteConcepto(id: number) {
    return cajaService.deleteConcepto(id)
  },

  // ==================== ORGANIZACION ====================
  async getOrganizacion() {
    const fondo = await prisma.fondoRotatorio.findFirst({ orderBy: { createdAt: 'asc' } })
    return {
      organizacion: fondo?.organizacion || '',
      monedaDefault: fondo?.moneda || 'PEN',
    }
  },

  async updateOrganizacion(data: z.infer<typeof organizacionUpdateSchema>) {
    const fondos = await prisma.fondoRotatorio.findMany()
    for (const fondo of fondos) {
      await prisma.fondoRotatorio.update({
        where: { id: fondo.id },
        data: { organizacion: data.organizacion, moneda: data.monedaDefault || fondo.moneda },
      })
    }
    return { organizacion: data.organizacion, monedaDefault: data.monedaDefault || 'PEN' }
  },
}
