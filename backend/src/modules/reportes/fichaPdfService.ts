import fs from 'fs'
import path from 'path'
import prisma from '../../config/prisma'
import { env } from '../../config/env'
import { HttpError } from '../../middleware/httpError'
import { renderHtmlToPdf } from './pdfService'
import { buildFichaSocioHtml, type FichaSocioData } from './fichaSocioTemplate'

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)

const estadoCivilMap: Record<string, string> = {
  S: 'Soltero',
  C: 'Casado',
  V: 'Viudo',
  D: 'Divorciado',
}

const mimeByExt: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function formatFecha(fecha: Date | null | undefined): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd} / ${mm} / ${yyyy}`
}

function fotoToDataUri(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null
  try {
    const relativePath = fotoUrl.replace(/^\/uploads\//, '')
    const fullPath = path.resolve(path.join(uploadDir, relativePath))
    if (!fullPath.startsWith(path.resolve(uploadDir))) return null
    if (!fs.existsSync(fullPath)) return null
    const ext = path.extname(fullPath).toLowerCase()
    const mime = mimeByExt[ext] || 'image/jpeg'
    const base64 = fs.readFileSync(fullPath).toString('base64')
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

export const fichaPdfService = {
  async generate(socioId: number, fondoId?: number): Promise<Buffer> {
    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      include: {
        beneficiarios: { orderBy: { createdAt: 'asc' } },
        fondosSocios: {
          include: { fondo: true },
          orderBy: { fechaIngreso: 'asc' },
        },
      },
    })

    if (!socio) throw new HttpError(404, 'Socio no encontrado')

    const allFondos = socio.fondosSocios
    let fondoSocio: (typeof allFondos)[number] | undefined = allFondos[0]

    if (fondoId !== undefined) {
      fondoSocio = allFondos.find((fs) => fs.fondoId === fondoId)
      if (!fondoSocio) throw new HttpError(400, 'El socio no pertenece a ese fondo')
    } else {
      fondoSocio = allFondos.find((fs) => fs.fondo.estado === 'ACTIVO') ?? allFondos[0]
    }

    const organizacion = fondoSocio?.fondo.nombre ?? 'Banquito 2.0'
    const lema = fondoSocio?.fondo.organizacion?.trim() || 'Bancos comunitarios'

    const data: FichaSocioData = {
      fichaNumero: String(socio.id).padStart(6, '0'),
      organizacion,
      lema,
      codigo: socio.codigo.toUpperCase(),
      dni: socio.dni,
      genero: socio.genero === 'M' ? 'Masculino' : 'Femenino',
      apellidoPaterno: socio.apellidoPaterno.toUpperCase(),
      apellidoMaterno: socio.apellidoMaterno.toUpperCase(),
      nombres: socio.nombres.toUpperCase(),
      fechaNacimiento: formatFecha(socio.fechaNacimiento),
      estadoCivil: estadoCivilMap[socio.estadoCivil || ''] || '—',
      telefono: socio.telefono?.toUpperCase() || '—',
      email: socio.email?.toLowerCase() || '—',
      fechaIngreso: formatFecha(socio.fechaIngreso),
      direccion: socio.direccion?.toUpperCase() || '—',
      fotoDataUri: fotoToDataUri(socio.fotoUrl),
      beneficiarios: socio.beneficiarios.map((b) => ({
        dni: b.dni,
        apellidoPaterno: b.apellidoPaterno.toUpperCase(),
        apellidoMaterno: b.apellidoMaterno.toUpperCase(),
        nombres: b.nombres.toUpperCase(),
        parentesco: b.parentesco.toUpperCase(),
        fechaNacimiento: formatFecha(b.fechaNacimiento),
        telefono: b.telefono?.toUpperCase() || '—',
      })),
    }

    const html = buildFichaSocioHtml(data)
    return renderHtmlToPdf(html)
  },
}
