import { execFileSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const backend = resolve(aqui, '..')
const destinoPath = resolve(backend, '..', 'schema.sql')

const encabezado = `-- ============================================================
--  Banquito Solidario - Esquema de base de datos
--  GENERADO AUTOMATICAMENTE desde backend/prisma/schema.prisma
--
--  No editar a mano. Para cambiar el esquema:
--    1. Editar backend/prisma/schema.prisma
--    2. Ejecutar: npm run db:schema  (desde backend/)
-- ============================================================

SET NAMES utf8mb3;

`

const cuerpo = execFileSync(
  'npx',
  ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { cwd: backend, encoding: 'utf8', shell: true }
)

writeFileSync(destinoPath, encabezado + cuerpo, 'utf8')
console.log(`schema.sql regenerado en ${destinoPath}`)
