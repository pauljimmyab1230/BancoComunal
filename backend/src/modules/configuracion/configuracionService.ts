import prisma from '../../config/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { HttpError } from '../../middeware/httpError'
import { cajaService } from '../caja/cajaService'

export const configuracionService = {
  // ==================== USUARIOS ====================
  async listUsuarios(params: { search?: string; page?: number; limit?: number; estado?: string; rol?: string }) {
    const { search, page = 1, limit = 10, estado, rol } = params
    const skip = (page - 1) * limit

    const where: any = {}
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
        select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, username: true, correo: true, telefono: true, rol: true, estado: true, ultimoAcceso: true, createdAt: true },
      }),
      prisma.usuario.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getUsuarioById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, username: true, correo: true, telefono: true, rol: true, estado: true, ultimoAcceso: true, createdAt: true },
    })
  },

  async createUsuario(data: any) {
    const existing = await prisma.usuario.findUnique({ where: { username: data.username } })
    if (existing) throw new HttpError(400, 'El nombre de usuario ya existe')

    if (data.correo) {
      const existingEmail = await prisma.usuario.findUnique({ where: { correo: data.correo } })
      if (existingEmail) throw new HttpError(400, 'El correo ya está registrado')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    return prisma.usuario.create({
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
      select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, username: true, correo: true, telefono: true, rol: true, estado: true, createdAt: true },
    })
  },

  async updateUsuario(id: number, data: any) {
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

    const updateData: any = {}
    if (data.nombres !== undefined) updateData.nombres = data.nombres
    if (data.apellidoPaterno !== undefined) updateData.apellidoPaterno = data.apellidoPaterno
    if (data.apellidoMaterno !== undefined) updateData.apellidoMaterno = data.apellidoMaterno
    if (data.username !== undefined) updateData.username = data.username
    if (data.correo !== undefined) updateData.correo = data.correo || null
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null
    if (data.rol !== undefined) updateData.rol = data.rol
    if (data.estado !== undefined) updateData.estado = data.estado

    return prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nombres: true, apellidoPaterno: true, apellidoMaterno: true, username: true, correo: true, telefono: true, rol: true, estado: true, createdAt: true },
    })
  },

  async updatePassword(id: number, newPassword: string) {
    const existing = await prisma.usuario.findUnique({ where: { id } })
    if (!existing) return null

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    return prisma.usuario.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, username: true },
    })
  },

  async deleteUsuario(id: number) {
    const existing = await prisma.usuario.findUnique({ where: { id } })
    if (!existing) return false
    if (existing.username === 'admin') throw new HttpError(400, 'No se puede eliminar el usuario admin')
    await prisma.usuario.delete({ where: { id } })
    return true
  },

  // ==================== LOGIN ====================
  async login(username: string, password: string) {
    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario) throw new HttpError(400, 'Usuario o contraseña incorrectos')
    if (usuario.estado !== 'ACTIVO') throw new HttpError(400, 'La cuenta está desactivada')

    const validPassword = await bcrypt.compare(password, usuario.password)
    if (!validPassword) throw new HttpError(400, 'Usuario o contraseña incorrectos')

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } })

    const token = jwt.sign(
      { userId: usuario.id, username: usuario.username, rol: usuario.rol },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
    )

    return {
      token,
      user: { id: usuario.id, nombres: usuario.nombres, apellidoPaterno: usuario.apellidoPaterno, username: usuario.username, correo: usuario.correo, rol: usuario.rol },
    }
  },

  // ==================== CONCEPTOS DE CAJA ====================
  // Las mutaciones delegan al servicio de caja para aplicar las validaciones estrictas
  // (no editar/eliminar conceptos con movimientos, 404s, etc.) y evitar dos fuentes de verdad.

  async listConceptos(params: { search?: string; page?: number; limit?: number; estado?: string; tipo?: string }) {
    const { search, page = 1, limit = 20, estado, tipo } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nombre: { contains: search } },
      ]
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

  async createConcepto(data: any) {
    const existing = await prisma.conceptoCaja.findUnique({ where: { codigo: data.codigo } })
    if (existing) throw new HttpError(400, 'El código del concepto ya existe')
    return cajaService.createConcepto(data)
  },

  async updateConcepto(id: number, data: any) {
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

  async updateOrganizacion(data: any) {
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
