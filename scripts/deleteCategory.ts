import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.category.deleteMany({
    where: {
      name: 'Tambahan'
    }
  })
  
  console.log('Deleted Tambahan category', deleted)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
