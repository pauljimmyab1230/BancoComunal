import prisma from '../../config/prisma'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { env } from '../../config/env'
import { HttpError } from '../../middleware/httpError'
import { createAuditLog } from '../../config/auditLog'
import { z } from 'zod'
import { createSocioSchema, updateSocioSchema, createBeneficiarioSchema } from './socioValidation'
import type { Prisma } from '@prisma/client'

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)

function generateCodigo(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  if (isNaN(date.getTime())) {
    throw new HttpError(400, 'Fecha inválida (formato YYYY-MM-DD)')
  }
  return date
}

function deleteFileIfExists(rutaArchivo: string | null | undefined) {
  if (!rutaArchivo) return
  try {
    const relativePath = rutaArchivo.replace(/^\/uploads\//, '')
    const fullPath = path.resolve(path.join(uploadDir, relativePath))
    if (!fullPath.startsWith(path.resolve(uploadDir))) return
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch {
    /* ignore */
  }
}

function buildNombreCompleto(
  nombres: string,
  apellidoPaterno: string,
  apellidoMaterno: string | null
): string {
  return [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')
}

function cleanupTempFile(filePath?: string) {
  if (!filePath) return
  try {
    fs.unlinkSync(filePath)
  } catch {
    /* ignore */
  }
}

function isAtleast18(fechaNacimiento: string): boolean {
  const birth = parseDate(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 18
}

export const socioService = {
  async list(params: { search?: string; page?: number; limit?: number; estado?: string }) {
    const { search, estado } = params
    const page = Math.max(1, Math.trunc(Number(params.page)) || 1)
    const limit = Math.min(100, Math.max(1, Math.trunc(Number(params.limit)) || 10))
    const skip = (page - 1) * limit

    const where: Prisma.SocioWhereInput = {}

    if (estado === 'A' || estado === 'I') {
      where.estado = estado
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { dni: { contains: search } },
        { nombres: { contains: search } },
        { apellidoPaterno: { contains: search } },
        { apellidoMaterno: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.socio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.socio.count({ where }),
    ])

    const socios = data.map((s) => ({
      ...s,
      nombreCompleto: buildNombreCompleto(s.nombres, s.apellidoPaterno, s.apellidoMaterno),
    }))

    return {
      data: socios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getById(id: number) {
    const socio = await prisma.socio.findUnique({
      where: { id },
      include: {
        beneficiarios: true,
        documentos: true,
        fondosSocios: {
          include: { fondo: true },
          orderBy: { fechaIngreso: 'desc' },
        },
      },
    })

    if (!socio) return null

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(
        socio.nombres,
        socio.apellidoPaterno,
        socio.apellidoMaterno
      ),
    }
  },

  async create(
    data: z.infer<typeof createSocioSchema>,
    fotoFile?: Express.Multer.File,
    usuarioId?: number
  ) {
    const existingDni = await prisma.socio.findUnique({ where: { dni: data.dni } })
    if (existingDni) {
      throw new HttpError(400, 'El DNI ya está registrado')
    }

    if (data.fechaNacimiento && !isAtleast18(data.fechaNacimiento)) {
      throw new HttpError(400, 'El socio debe ser mayor de 18 años')
    }

    let fotoUrl: string | undefined

    if (fotoFile) {
      const ext = path.extname(fotoFile.originalname)
      const filename = `fotos/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const destPath = path.join(uploadDir, filename)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(fotoFile.path, destPath)
      cleanupTempFile(fotoFile.path)
      fotoUrl = `/uploads/${filename}`
    }

    let codigo = generateCodigo()
    let exists = await prisma.socio.findUnique({ where: { codigo } })
    let retries = 0
    while (exists && retries < 10) {
      codigo = generateCodigo()
      exists = await prisma.socio.findUnique({ where: { codigo } })
      retries++
    }
    if (exists) throw new HttpError(500, 'No se pudo generar un código único para el socio')

    let socio: Awaited<ReturnType<typeof prisma.socio.create>>
    try {
      socio = await prisma.socio.create({
        data: {
          codigo,
          dni: data.dni,
          nombres: data.nombres,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          genero: data.genero,
          fechaNacimiento: data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null,
          estadoCivil: data.estadoCivil || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          email: data.email || null,
          fechaIngreso: parseDate(data.fechaIngreso),
          estado: data.estado || 'A',
          fotoUrl,
        },
      })
    } catch (error) {
      deleteFileIfExists(fotoUrl)
      throw error
    }

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'CREATE',
      datosNuevos: {
        codigo: socio.codigo,
        dni: socio.dni,
        nombres: socio.nombres,
        apellidoPaterno: socio.apellidoPaterno,
        estado: socio.estado,
      },
      usuarioId,
    })

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(
        socio.nombres,
        socio.apellidoPaterno,
        socio.apellidoMaterno
      ),
    }
  },

  async update(
    id: number,
    data: z.infer<typeof updateSocioSchema>,
    fotoFile?: Express.Multer.File,
    usuarioId?: number
  ) {
    const existing = await prisma.socio.findUnique({ where: { id } })
    if (!existing) return null

    if (data.dni && data.dni !== existing.dni) {
      const duplicateDni = await prisma.socio.findUnique({ where: { dni: data.dni } })
      if (duplicateDni) {
        throw new HttpError(400, 'El DNI ya está registrado en otro socio')
      }
    }

    if (data.fechaNacimiento && !isAtleast18(data.fechaNacimiento)) {
      throw new HttpError(400, 'El socio debe ser mayor de 18 años')
    }

    if (data.estado === 'I' && existing.estado !== 'I') {
      const prestamosActivos = await prisma.prestamo.count({
        where: { fondoSocio: { socioId: id }, estado: 'ACTIVO' },
      })
      if (prestamosActivos > 0) {
        throw new HttpError(
          400,
          'No se puede desactivar: el socio tiene créditos activos. Regularícelos antes de darlo de baja.'
        )
      }
    }

    let fotoUrl = existing.fotoUrl

    if (fotoFile) {
      const ext = path.extname(fotoFile.originalname)
      const filename = `fotos/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const destPath = path.join(uploadDir, filename)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(fotoFile.path, destPath)
      cleanupTempFile(fotoFile.path)
      fotoUrl = `/uploads/${filename}`
    }

    const updateData: Prisma.SocioUpdateInput = {}
    if (data.dni !== undefined) updateData.dni = data.dni
    if (data.nombres !== undefined) updateData.nombres = data.nombres
    if (data.apellidoPaterno !== undefined) updateData.apellidoPaterno = data.apellidoPaterno
    if (data.apellidoMaterno !== undefined) updateData.apellidoMaterno = data.apellidoMaterno
    if (data.genero !== undefined) updateData.genero = data.genero
    if (data.fechaNacimiento !== undefined)
      updateData.fechaNacimiento = data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null
    if (data.estadoCivil !== undefined) updateData.estadoCivil = data.estadoCivil || null
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null
    if (data.direccion !== undefined) updateData.direccion = data.direccion || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.fechaIngreso !== undefined) updateData.fechaIngreso = parseDate(data.fechaIngreso)
    if (data.estado !== undefined) updateData.estado = data.estado
    if (data.quitarFoto === 'true') {
      updateData.fotoUrl = null
    } else if (fotoUrl) {
      updateData.fotoUrl = fotoUrl
    }

    let socio: Awaited<ReturnType<typeof prisma.socio.update>>
    try {
      socio = await prisma.socio.update({
        where: { id },
        data: updateData,
      })
    } catch (error) {
      if (fotoFile && fotoUrl !== existing.fotoUrl) {
        deleteFileIfExists(fotoUrl)
      }
      throw error
    }

    if (data.quitarFoto === 'true') {
      deleteFileIfExists(existing.fotoUrl)
    } else if (fotoFile && fotoUrl !== existing.fotoUrl) {
      deleteFileIfExists(existing.fotoUrl)
    }

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'UPDATE',
      datosAnteriores: { dni: existing.dni, nombres: existing.nombres, estado: existing.estado },
      datosNuevos: updateData,
      usuarioId,
    })

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(
        socio.nombres,
        socio.apellidoPaterno,
        socio.apellidoMaterno
      ),
    }
  },

  async delete(id: number, usuarioId?: number) {
    const socio = await prisma.socio.findUnique({
      where: { id },
      include: {
        documentos: { select: { rutaArchivo: true } },
      },
    })
    if (!socio) return { success: false, message: 'Socio no encontrado' }

    const [prestamosCount, aportesCount, membresiasActivas] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocio: { socioId: id } } }),
      prisma.aporte.count({ where: { fondoSocio: { socioId: id } } }),
      prisma.fondoSocio.count({ where: { socioId: id, fechaSalida: null } }),
    ])

    if (prestamosCount > 0) {
      return {
        success: false,
        message: 'No se puede eliminar: el socio tiene préstamos registrados',
      }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede eliminar: el socio tiene aportes registrados' }
    }
    if (membresiasActivas > 0) {
      return {
        success: false,
        message: 'No se puede eliminar: el socio pertenece a uno o más fondos',
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.beneficiario.deleteMany({ where: { socioId: id } })
      await tx.documentoSocio.deleteMany({ where: { socioId: id } })
      await tx.fondoSocio.deleteMany({ where: { socioId: id } })
      await tx.socio.delete({ where: { id } })
    })

    deleteFileIfExists(socio.fotoUrl)
    socio.documentos.forEach((d) => deleteFileIfExists(d.rutaArchivo))

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'DELETE',
      datosAnteriores: {
        codigo: socio.codigo,
        dni: socio.dni,
        nombres: socio.nombres,
        apellidoPaterno: socio.apellidoPaterno,
      },
      usuarioId,
    })

    return { success: true, message: 'Socio eliminado correctamente' }
  },

  // Beneficiarios
  async getBeneficiarios(socioId: number) {
    return prisma.beneficiario.findMany({ where: { socioId } })
  },

  async addBeneficiario(socioId: number, data: z.infer<typeof createBeneficiarioSchema>) {
    const socio = await prisma.socio.findUnique({ where: { id: socioId } })
    if (!socio) return null

    if (data.dni === socio.dni) {
      throw new HttpError(400, 'El beneficiario no puede ser el mismo socio')
    }

    const duplicado = await prisma.beneficiario.findFirst({
      where: { socioId, dni: data.dni },
      select: { id: true },
    })
    if (duplicado) {
      throw new HttpError(400, 'Ya existe un beneficiario con ese DNI para este socio')
    }

    return prisma.beneficiario.create({
      data: {
        ...data,
        socioId,
        telefono: data.telefono || null,
        fechaNacimiento: data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null,
      },
    })
  },

  async updateBeneficiario(
    socioId: number,
    beneficiarioId: number,
    data: Partial<z.infer<typeof createBeneficiarioSchema>>
  ) {
    const beneficiario = await prisma.beneficiario.findFirst({
      where: { id: beneficiarioId, socioId },
    })
    if (!beneficiario) return null

    // Usar transacción para garantizar que solo se actualice si pertenece al socio
    return prisma.$transaction(async (tx) => {
      const updated = await tx.beneficiario.updateMany({
        where: { id: beneficiarioId, socioId },
        data: {
          ...data,
          fechaNacimiento: data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null,
        },
      })
      if (updated.count === 0) throw new HttpError(404, 'Beneficiario no encontrado')
      return tx.beneficiario.findUnique({ where: { id: beneficiarioId } })
    })
  },

  async deleteBeneficiario(socioId: number, beneficiarioId: number) {
    const beneficiario = await prisma.beneficiario.findFirst({
      where: { id: beneficiarioId, socioId },
    })
    if (!beneficiario) return false

    // Usar deleteMany para garantizar que solo se elimine si pertenece al socio
    const deleted = await prisma.beneficiario.deleteMany({
      where: { id: beneficiarioId, socioId },
    })
    return deleted.count > 0
  },

  // Documentos
  async getDocumentos(socioId: number) {
    return prisma.documentoSocio.findMany({ where: { socioId } })
  },

  async uploadDocumento(socioId: number, file: Express.Multer.File, tipoDocumento: string) {
    const socio = await prisma.socio.findUnique({ where: { id: socioId } })
    if (!socio) return null

    const ext = path.extname(file.originalname)
    const filename = `documentos/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const destPath = path.join(uploadDir, filename)
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    fs.copyFileSync(file.path, destPath)
    cleanupTempFile(file.path)

    const rutaRelativa = `/uploads/${filename}`
    try {
      return await prisma.documentoSocio.create({
        data: {
          tipoDocumento,
          nombreArchivo: file.originalname,
          rutaArchivo: rutaRelativa,
          mimeType: file.mimetype,
          tamano: file.size,
          socioId,
        },
      })
    } catch (error) {
      deleteFileIfExists(rutaRelativa)
      throw error
    }
  },

  async deleteDocumento(socioId: number, documentoId: number) {
    const doc = await prisma.documentoSocio.findFirst({
      where: { id: documentoId, socioId },
    })
    if (!doc) return false

    await prisma.documentoSocio.delete({ where: { id: documentoId } })
    deleteFileIfExists(doc.rutaArchivo)
    return true
  },
}
