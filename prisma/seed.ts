import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Hash password
  const hashedPasswordAdmin = await bcrypt.hash('Admin12345!', 10)
  const hashedPasswordKasir = await bcrypt.hash('Kasir12345!', 10)
  const hashedPasswordPelanggan = await bcrypt.hash('Pelanggan12345!', 10)

  // Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ojolali.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@ojolali.local',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  })

  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@ojolali.local' },
    update: {},
    create: {
      name: 'Kasir',
      email: 'kasir@ojolali.local',
      password: hashedPasswordKasir,
      role: 'KASIR',
    },
  })

  const pelanggan = await prisma.user.upsert({
    where: { email: 'pelanggan@ojolali.local' },
    update: {},
    create: {
      name: 'Pelanggan',
      email: 'pelanggan@ojolali.local',
      password: hashedPasswordPelanggan,
      role: 'PELANGGAN',
    },
  })

  // Create Categories
  const categoriesData = [
    { name: 'Baso', description: 'Aneka baso sapi asli' },
    { name: 'Mie Ayam', description: 'Mie ayam spesial' },
    { name: 'Minuman', description: 'Minuman segar' },
    { name: 'Tambahan', description: 'Menu tambahan / ekstra' },
  ]

  const categories: Record<string, string> = {}
  for (const c of categoriesData) {
    const created = await prisma.category.create({ data: c })
    categories[c.name] = created.id
  }

  // Create Products
  const productsData = [
    { categoryId: categories['Baso'], name: 'Baso Original', description: 'Baso urat dan halus', price: 15000 },
    { categoryId: categories['Baso'], name: 'Baso Urat', description: 'Full baso urat besar', price: 18000 },
    { categoryId: categories['Baso'], name: 'Baso Mercon', description: 'Baso isi sambal pedas', price: 20000 },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Original', description: 'Mie ayam klasik', price: 12000 },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Baso', description: 'Mie ayam dengan tambahan baso', price: 17000 },
    { categoryId: categories['Minuman'], name: 'Es Teh', description: 'Es teh manis segar', price: 4000 },
    { categoryId: categories['Minuman'], name: 'Es Jeruk', description: 'Es jeruk peras asli', price: 6000 },
  ]

  for (const p of productsData) {
    await prisma.product.create({ data: p })
  }

  console.log('Seed database completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
