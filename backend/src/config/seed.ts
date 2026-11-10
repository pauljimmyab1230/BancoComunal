import prisma from './prisma'
import bcrypt from 'bcryptjs'
import { logger } from './logger'

export async function seedDatabase() {
  const adminExists = await prisma.usuario.findUnique({ where: { username: 'admin' } })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 12)

    await prisma.usuario.create({
      data: {
        nombres: 'Administrador',
        apellidoPaterno: 'Sistema',
        apellidoMaterno: 'Banquito',
        username: 'admin',
        password: hashedPassword,
        correo: 'admin@banquito.com',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        cambiarPassword: false,
      },
    })

    logger.info('Usuario admin creado (admin / admin123)')
  } else {
    logger.info('Usuario admin ya existe')
  }
}
