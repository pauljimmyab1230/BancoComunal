import prisma from './prisma'
import bcrypt from 'bcryptjs'

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
        cambiarPassword: true,
      },
    })

    console.log('✓ Usuario admin creado (admin / admin123) - Debe cambiar contraseña en primer login')
  } else {
    console.log('• Usuario admin ya existe')
  }
}
