import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import { env } from './env'

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR)

// Crear directorios si no existen
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureDir(uploadDir)
ensureDir(path.join(uploadDir, 'fotos'))
ensureDir(path.join(uploadDir, 'documentos'))

export function generarNombreArchivo(extension: string): string {
  const ext = extension && !extension.startsWith('.') ? `.${extension}` : extension
  return `${crypto.randomBytes(16).toString('hex')}${ext}`
}

function coincideFirmaMagic(extension: string, cabecera: Buffer): boolean {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return cabecera.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    case '.png':
      return cabecera.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    case '.pdf':
      return cabecera.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]))
    case '.webp':
      return (
        cabecera.subarray(0, 4).equals(Buffer.from('RIFF')) &&
        cabecera.subarray(8, 12).equals(Buffer.from('WEBP'))
      )
    case '.doc':
    case '.xls':
      return cabecera.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))
    case '.docx':
    case '.xlsx':
      return cabecera.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    default:
      return false
  }
}

async function leerCabecera(ruta: string, longitud = 12): Promise<Buffer> {
  const archivo = await fs.promises.open(ruta, 'r')
  try {
    const buffer = Buffer.alloc(longitud)
    const { bytesRead } = await archivo.read(buffer, 0, longitud, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await archivo.close()
  }
}

async function validarContenidoArchivo(ruta: string, nombreOriginal: string): Promise<void> {
  const extension = path.extname(nombreOriginal).toLowerCase()
  const cabecera = await leerCabecera(ruta)
  if (!coincideFirmaMagic(extension, cabecera)) {
    throw new Error(
      `Tipo de archivo no permitido: el contenido no coincide con la extensión ${extension}`
    )
  }
}

const almacenamientoDisco = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    cb(null, generarNombreArchivo(path.extname(file.originalname)))
  },
})

const storage: multer.StorageEngine = {
  _handleFile(req, file, cb) {
    if (!almacenamientoDisco._handleFile)
      return cb(new Error('Almacenamiento de archivos no disponible'))
    almacenamientoDisco._handleFile(req, file, (error, info) => {
      if (error || !info?.path) {
        cb(error ?? new Error('No se pudo guardar el archivo'))
        return
      }
      const ruta = info.path
      validarContenidoArchivo(ruta, file.originalname)
        .then(() => cb(null, info))
        .catch((err: Error) => {
          fs.promises.unlink(ruta).finally(() => cb(err))
        })
    })
  },
  _removeFile(req, file, cb) {
    if (!almacenamientoDisco._removeFile)
      return cb(new Error('Almacenamiento de archivos no disponible'))
    almacenamientoDisco._removeFile(req, file, cb)
  },
}

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp']
  const allowedDocMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ]

  const allowedImageExts = /\.(jpg|jpeg|png|webp)$/i
  const allowedDocExts = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png)$/i

  if (file.fieldname === 'foto') {
    if (allowedImageMimes.includes(file.mimetype) && allowedImageExts.test(file.originalname)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no permitido para foto. Use JPG, PNG o WebP'))
    }
  } else if (file.fieldname === 'documento') {
    if (allowedDocMimes.includes(file.mimetype) && allowedDocExts.test(file.originalname)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Tipo de archivo no permitido para documento. Use PDF, DOC, DOCX, XLS, XLSX, JPG o PNG'
        )
      )
    }
  } else {
    cb(new Error('Campo de archivo no válido'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})
