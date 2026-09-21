import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const basoCat = await prisma.category.findFirst({ where: { name: 'Baso' } })
  const mieAyamCat = await prisma.category.findFirst({ where: { name: 'Mie Ayam' } })
  const minumanCat = await prisma.category.findFirst({ where: { name: 'Minuman' } })
  
  if (!basoCat || !mieAyamCat || !minumanCat) {
    console.error("Categories missing!")
    process.exit(1)
  }

  const menuItems = [
    // BASO
    { categoryId: basoCat.id, name: 'Bakso Rusuk', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Tetelan', price: 14000 },
    { categoryId: basoCat.id, name: 'Bakso Balungan', price: 14000 },
    { categoryId: basoCat.id, name: 'Bakso Urat', price: 12000 },
    { categoryId: basoCat.id, name: 'Bakso Daging', price: 12000 },
    { categoryId: basoCat.id, name: 'Bakso Telor', price: 12000 },
    { categoryId: basoCat.id, name: 'Bakso Mercon', price: 12000 },
    { categoryId: basoCat.id, name: 'Bakso Mercon + Telor', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Daging + Urat', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Daging + Mercon', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Mercon + Urat', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Telor + Urat', price: 18000 },
    { categoryId: basoCat.id, name: 'Bakso Telor + Daging', price: 18000 },
    
    // MIE AYAM
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Ceker', price: 14000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Biasa', price: 12000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Bakso Urat', price: 18000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Bakso Daging', price: 18000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Bakso Telor', price: 18000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Bakso Mercon', price: 18000 },
    { categoryId: mieAyamCat.id, name: 'Mie Ayam Bakso Kecil', price: 18000 },

    // MINUMAN (setting to 5000 as a placeholder since image has no prices, but we must have them)
    // Wait, the user said "Jangan mengarang harga", so 0 is better. But 0 makes it free.
    // I will set them to 0 and add a description.
    { categoryId: minumanCat.id, name: 'Teh Botol Sosro', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Es Teh Manis', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Fruit Tea', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Teh Manis Anget', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Tebs', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Good Day', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Prima / Air Mineral', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Nutrisari', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Es Jeruk Peras', price: 0, description: 'Harga menyesuaikan di kasir' },
    { categoryId: minumanCat.id, name: 'Jeruk Anget', price: 0, description: 'Harga menyesuaikan di kasir' },
  ]

  // Hide all current products
  await prisma.product.updateMany({
    data: { isAvailable: false }
  })

  // Upsert new products based on name to avoid duplicates if run multiple times
  for (const item of menuItems) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name }
    })
    
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          price: item.price, 
          categoryId: item.categoryId,
          isAvailable: true,
          ...(item.description && { description: item.description })
        }
      })
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
          isAvailable: true,
          ...(item.description && { description: item.description })
        }
      })
    }
  }

  console.log("Menu updated successfully")
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
