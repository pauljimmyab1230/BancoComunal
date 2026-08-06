import prisma from '../config/prisma'

async function main() {
  const prestamosAnulados = await prisma.prestamo.findMany({
    where: { estado: 'ANULADO' },
    select: { id: true },
  })

  const ids = prestamosAnulados.map((p) => p.id)
  if (ids.length === 0) {
    console.log('No hay préstamos anulados')
    return
  }

  const result = await prisma.cuotaPrestamo.updateMany({
    where: { prestamoId: { in: ids }, estado: 'ANULADO' },
    data: { saldoPendiente: 0 },
  })

  console.log(`Cuotas anuladas limpiadas: ${result.count} (préstamos: ${ids.join(', ')})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
