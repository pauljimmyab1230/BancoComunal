import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImages = /\.(jpg|jpeg|png|webp)$/i
  const allowedDocs = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png)$/i

  if (file.fieldname === 'foto' && allowedImages.test(file.originalname)) {
    cb(null, true)
  } else if (file.fieldname === 'documento' && allowedDocs.test(file.originalname)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})
