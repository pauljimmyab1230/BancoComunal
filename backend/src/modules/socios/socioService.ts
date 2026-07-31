import prisma from '../../config/prisma'
import path from 'path'
import fs from 'fs'
import { env } from '../../config/env'

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)

function generateCodigo(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function deleteFileIfExists(rutaArchivo: string | null) {
  if (!rutaArchivo) return
  try {
    const relativePath = rutaArchivo.replace(/^\/uploads\//, '')
    const fullPath = path.resolve(path.join(uploadDir, relativePath))
    if (!fullPath.startsWith(path.resolve(uploadDir))) return
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch { /* ignore */ }
}

function buildNombreCompleto(nombres: string, apellidoPaterno: string, apellidoMaterno: string | null): string {
  return [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ')
}

function cleanupTempFile(filePath?: string) {
  if (!filePath) return
  try { fs.unlinkSync(filePath) } catch { /* ignore */ }
}

function isAtleast18(fechaNacimiento: string): boolean {
  const birth = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 18
}

async function createAuditLog(data: { tabla: string; registroId: number; operacion: string; datosAnteriores?: any; datosNuevos?: any }) {
  try {
    await prisma.auditLog.create({ data })
  } catch { /* tabla puede no existir */ }
}

export const socioService = {
  async list(params: { search?: string; page?: number; limit?: number; estado?: string }) {
    const { search, page = 1, limit = 10, estado } = params
    const skip = (page - 1) * limit

    const where: any = {}

    if (estado) {
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
      },
    })

    if (!socio) return null

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(socio.nombres, socio.apellidoPaterno, socio.apellidoMaterno),
    }
  },

  async create(data: any, fotoFile?: Express.Multer.File) {
    const existingDni = await prisma.socio.findUnique({ where: { dni: data.dni } })
    if (existingDni) {
      throw new Error('El DNI ya está registrado')
    }

    if (data.fechaNacimiento && !isAtleast18(data.fechaNacimiento)) {
      throw new Error('El socio debe ser mayor de 18 años')
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
    while (exists) {
      codigo = generateCodigo()
      exists = await prisma.socio.findUnique({ where: { codigo } })
    }

    const socio = await prisma.socio.create({
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

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'CREATE',
      datosNuevos: { codigo: socio.codigo, dni: socio.dni, nombres: socio.nombres, apellidoPaterno: socio.apellidoPaterno, estado: socio.estado },
    })

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(socio.nombres, socio.apellidoPaterno, socio.apellidoMaterno),
    }
  },

  async update(id: number, data: any, fotoFile?: Express.Multer.File) {
    const existing = await prisma.socio.findUnique({ where: { id } })
    if (!existing) return null

    if (data.dni && data.dni !== existing.dni) {
      const duplicateDni = await prisma.socio.findUnique({ where: { dni: data.dni } })
      if (duplicateDni) {
        throw new Error('El DNI ya está registrado en otro socio')
      }
    }

    if (data.fechaNacimiento && !isAtleast18(data.fechaNacimiento)) {
      throw new Error('El socio debe ser mayor de 18 años')
    }

    let fotoUrl = existing.fotoUrl

    if (fotoFile) {
      deleteFileIfExists(existing.fotoUrl)
      const ext = path.extname(fotoFile.originalname)
      const filename = `fotos/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      const destPath = path.join(uploadDir, filename)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(fotoFile.path, destPath)
      cleanupTempFile(fotoFile.path)
      fotoUrl = `/uploads/${filename}`
    }

    const updateData: any = {}
    if (data.dni !== undefined) updateData.dni = data.dni
    if (data.nombres !== undefined) updateData.nombres = data.nombres
    if (data.apellidoPaterno !== undefined) updateData.apellidoPaterno = data.apellidoPaterno
    if (data.apellidoMaterno !== undefined) updateData.apellidoMaterno = data.apellidoMaterno
    if (data.genero !== undefined) updateData.genero = data.genero
    if (data.fechaNacimiento !== undefined) updateData.fechaNacimiento = data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null
    if (data.estadoCivil !== undefined) updateData.estadoCivil = data.estadoCivil || null
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null
    if (data.direccion !== undefined) updateData.direccion = data.direccion || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.fechaIngreso !== undefined) updateData.fechaIngreso = parseDate(data.fechaIngreso)
    if (data.estado !== undefined) updateData.estado = data.estado
    if (fotoUrl) updateData.fotoUrl = fotoUrl

    const socio = await prisma.socio.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'UPDATE',
      datosAnteriores: { dni: existing.dni, nombres: existing.nombres, estado: existing.estado },
      datosNuevos: updateData,
    })

    return {
      ...socio,
      nombreCompleto: buildNombreCompleto(socio.nombres, socio.apellidoPaterno, socio.apellidoMaterno),
    }
  },

  async delete(id: number) {
    const socio = await prisma.socio.findUnique({
      where: { id },
      include: {
        documentos: { select: { rutaArchivo: true } },
      },
    })
    if (!socio) return { success: false, message: 'Socio no encontrado' }

    const [prestamosActivos, cuentasCount, aportesCount, membresias] = await Promise.all([
      prisma.prestamo.count({ where: { fondoSocio: { socioId: id }, estado: 'ACTIVO' } }),
      prisma.cuentaAhorro.count({ where: { fondoSocio: { socioId: id } } }),
      prisma.aporte.count({ where: { fondoSocio: { socioId: id } } }),
      prisma.fondoSocio.count({ where: { socioId: id } }),
    ])

    if (prestamosActivos > 0) {
      return { success: false, message: 'No se puede eliminar: el socio tiene préstamos activos' }
    }
    if (cuentasCount > 0) {
      return { success: false, message: 'No se puede eliminar: el socio tiene cuentas de ahorro' }
    }
    if (aportesCount > 0) {
      return { success: false, message: 'No se puede eliminar: el socio tiene aportes registrados' }
    }
    if (membresias > 0) {
      return { success: false, message: 'No se puede eliminar: el socio pertenece a uno o más fondos' }
    }

    deleteFileIfExists(socio.fotoUrl)
    socio.documentos.forEach((d) => deleteFileIfExists(d.rutaArchivo))

    await createAuditLog({
      tabla: 'Socio',
      registroId: socio.id,
      operacion: 'DELETE',
      datosAnteriores: { codigo: socio.codigo, dni: socio.dni, nombres: socio.nombres, apellidoPaterno: socio.apellidoPaterno },
    })

    await prisma.socio.delete({ where: { id } })
    return { success: true, message: 'Socio eliminado correctamente' }
  },

  // Beneficiarios
  async getBeneficiarios(socioId: number) {
    return prisma.beneficiario.findMany({ where: { socioId } })
  },

  async addBeneficiario(socioId: number, data: any) {
    const socio = await prisma.socio.findUnique({ where: { id: socioId } })
    if (!socio) return null

    return prisma.beneficiario.create({
      data: {
        ...data,
        socioId,
        fechaNacimiento: data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null,
      },
    })
  },

  async updateBeneficiario(socioId: number, beneficiarioId: number, data: any) {
    const beneficiario = await prisma.beneficiario.findFirst({
      where: { id: beneficiarioId, socioId },
    })
    if (!beneficiario) return null

    return prisma.beneficiario.update({
      where: { id: beneficiarioId },
      data: {
        ...data,
        fechaNacimiento: data.fechaNacimiento ? parseDate(data.fechaNacimiento) : null,
      },
    })
  },

  async deleteBeneficiario(socioId: number, beneficiarioId: number) {
    const beneficiario = await prisma.beneficiario.findFirst({
      where: { id: beneficiarioId, socioId },
    })
    if (!beneficiario) return false

    await prisma.beneficiario.delete({ where: { id: beneficiarioId } })
    return true
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

    return prisma.documentoSocio.create({
      data: {
        tipoDocumento,
        nombreArchivo: file.originalname,
        rutaArchivo: `/uploads/${filename}`,
        mimeType: file.mimetype,
        tamaño: file.size,
        socioId,
      },
    })
  },

  async deleteDocumento(socioId: number, documentoId: number) {
    const doc = await prisma.documentoSocio.findFirst({
      where: { id: documentoId, socioId },
    })
    if (!doc) return false

    deleteFileIfExists(doc.rutaArchivo)
    await prisma.documentoSocio.delete({ where: { id: documentoId } })
    return true
  },
}
