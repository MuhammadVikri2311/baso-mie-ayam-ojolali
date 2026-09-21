import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const basoCat = await prisma.category.findFirst({ where: { name: 'Baso' } })
  const mieAyamCat = await prisma.category.findFirst({ where: { name: 'Mie Ayam' } })
  const minumanCat = await prisma.category.findFirst({ where: { name: 'Minuman' } })
  const tambahanCat = await prisma.category.findFirst({ where: { name: 'Tambahan' } })

  console.log({ basoCat, mieAyamCat, minumanCat, tambahanCat })
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
