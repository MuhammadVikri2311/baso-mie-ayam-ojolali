import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create Admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@ojolali.com' },
    update: {},
    create: {
      email: 'admin@ojolali.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const categoriesData = [
    { name: 'Bakso', description: 'Aneka bakso sapi asli pilihan Ojolali' },
    { name: 'Mie Ayam', description: 'Aneka olahan mie ayam khas Ojolali' },
    { name: 'Minuman', description: 'Minuman segar dingin dan hangat' },
  ]

  const categories: Record<string, string> = {}

  for (const c of categoriesData) {
    let category = await prisma.category.findFirst({ where: { name: c.name } })
    if (category) {
      category = await prisma.category.update({ where: { id: category.id }, data: c })
    } else {
      category = await prisma.category.create({ data: c })
    }
    categories[c.name] = category.id
  }

  // Create Products - Sesuai Foto Menu Asli & Gambar Unik Tiap Menu
  const productsData = [
    // 13 Bakso Items (Foto Asli Produk Ojolali)
    { categoryId: categories['Bakso'], name: 'Bakso Rusuk', description: 'Bakso sapi disajikan dengan potongan tulang rusuk / iga sapi berdaging tebal dan kaldu gurih mantap.', price: 18000, image: '/images/products/bakso-rusuk.webp', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Tetelan', description: 'Bakso sapi kenyal dengan tambahan limpahan potongan tetelan daging sapi gurih berlemak lembut.', price: 14000, image: '/images/products/bakso-tetelan.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Balungan', description: 'Bakso sapi dengan balungan tulang sapi beraroma kaldu kaya rasa khas Ojolali.', price: 14000, image: '/images/products/bakso-balungan.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Urat', description: 'Bakso urat sapi ukuran mantap dengan tekstur kasar berurat kenyal dan kuah kaldu sapi asli.', price: 12000, image: '/images/products/bakso-urat.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Daging', description: 'Bakso daging sapi halus bertekstur lembut kenyal dari olahan daging sapi segar pilihan.', price: 12000, image: '/images/products/bakso-daging.webp', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Telor', description: 'Bakso sapi berukuran jumbo dengan isian sebutir telur ayam utuh di dalamnya.', price: 12000, image: '/images/products/bakso-telur.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Mercon', description: 'Sensasi pedas meledak! Bakso sapi berisikan ulekan cabe rawit merah segar super pedas.', price: 12000, image: '/images/products/bakso-mercon.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Mercon + Telor', description: 'Kombinasi juara: nikmatnya bakso cabe mercon pedas bersanding dengan bakso isi telur ayam.', price: 18000, image: '/images/products/bakso-mercon-telur.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Daging + Urat', description: 'Paduan komplit sebutir bakso daging sapi halus lembut dan sebutir bakso urat kenyal mantap.', price: 18000, image: '/images/products/bakso-daging-urat.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Daging + Mercon', description: 'Kombinasi seimbang antara gurih lembutnya bakso daging dan ledakan pedas bakso mercon.', price: 18000, image: '/images/products/bakso-daging-mercon.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Mercon + Urat', description: 'Duet favorit pecinta kuliner: sensasi pedas gurih bakso mercon berpadu dengan bakso urat berurat kenyal.', price: 18000, image: '/images/products/bakso-mercon-urat.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Telor + Urat', description: 'Menu paling dicari: bakso isi telur ayam utuh dipadu bakso urat sapi ukuran mantap.', price: 18000, image: '/images/products/bakso-telor-urat.jpg', isAvailable: true },
    { categoryId: categories['Bakso'], name: 'Bakso Telor + Daging', description: 'Kombinasi nikmat dan mengenyangkan: bakso isi telur ayam utuh dan bakso daging sapi halus.', price: 18000, image: '/images/products/bakso-telor-daging.jpg', isAvailable: true },

    // 7 Mie Ayam Items (Foto Asli Produk Ojolali)
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Ceker', description: 'Mie ayam kenyal dengan potongan daging ayam gurih dan topping ceker ayam empuk berbumbu meresap.', price: 14000, image: '/images/products/mie-ayam-ceker.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Biasa', description: 'Mie ayam klasik khas Ojolali dengan tekstur mie kenyal, cincangan ayam manis gurih, dan sawi segar.', price: 12000, image: '/images/products/mie-ayam-biasa.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Bakso Urat', description: 'Mie ayam lezat disajikan dengan pelengkap sebutir bakso urat sapi besar berurat kasar mantap.', price: 18000, image: '/images/products/mie-ayam-bakso-urat.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Bakso Daging', description: 'Mie ayam komplit dengan tambahan bakso daging sapi halus kenyal bercita rasa gurih.', price: 18000, image: '/images/products/mie-ayam-bakso-daging.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Bakso Telor', description: 'Mie ayam porsi istimewa disajikan bersama bakso sapi jumbo berisikan telur ayam utuh.', price: 18000, image: '/images/products/mie-ayam-bakso-telor.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Bakso Mercon', description: 'Mie ayam gurih dengan paduan bakso mercon pedas cabai rawit merah yang membakar selera.', price: 18000, image: '/images/products/mie-ayam-bakso-mercon.jpg', isAvailable: true },
    { categoryId: categories['Mie Ayam'], name: 'Mie Ayam Bakso Kecil', description: 'Mie ayam dengan limpahan beberapa butir bakso kerikil / bakso daging mini kenyal.', price: 18000, image: '/images/products/mie-ayam-bakso-kecil.jpg', isAvailable: true },

    // 10 Minuman Items (Foto Asli Produk Ojolali)
    { categoryId: categories['Minuman'], name: 'Teh Botol Sosro', description: 'Teh Botol Sosro dingin original yang menyegarkan dahaga setelah menyantap hidangan pedas.', price: 5000, image: '/images/products/teh-botol-sosro.png', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Es Teh Manis', description: 'Es teh manis segar dari seduhan daun teh melati wangi dengan es batu melimpah.', price: 4000, image: '/images/products/es-teh-manis.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Fruit Tea', description: 'Minuman teh rasa buah Fruit Tea dingin dengan kesegaran rasa buah yang nikmat.', price: 5000, image: '/images/products/fruit-tea.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Teh Manis Anget', description: 'Teh manis hangat dengan aroma harum melati pas dinikmati bersama kuah bakso hangat.', price: 4000, image: '/images/products/teh-manis-anget.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Tebs', description: 'Minuman teh berkarbonasi Tebs dingin segar dan bersoda sensasi unik yang seru.', price: 5000, image: '/images/products/tebs.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Good Day', description: 'Kopi Good Day siap saji nikmat dingin dengan rasa manis pas untuk menemani santai.', price: 5000, image: '/images/products/good-day.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Prima / Air Mineral', description: 'Air mineral botol Prima segar murni dan higienis untuk menjaga hidrasi tubuh.', price: 3000, image: '/images/products/prima-air-mineral.webp', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Nutrisari', description: 'Minuman sari buah jeruk Nutrisari dingin dengan kesegaran vitamin C alami.', price: 4000, image: '/images/products/nutrisari.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Es Jeruk Peras', description: 'Es jeruk dari perasan buah jeruk segar asli dengan bulir jeruk alami yang manis asam menyegarkan.', price: 6000, image: '/images/products/es-jeruk-peras.jpg', isAvailable: true },
    { categoryId: categories['Minuman'], name: 'Jeruk Anget', description: 'Air perasan jeruk asli hangat menyehatkan dan memberikan kehangatan bagi tubuh.', price: 5000, image: '/images/products/jeruk-anget.jpg', isAvailable: true },
  ]

  for (const p of productsData) {
    // Map old names to new names to update existing records instead of recreating
    let oldName = p.name;
    if (p.name === 'Bakso Original') oldName = 'Baso Original';
    if (p.name === 'Bakso Urat') oldName = 'Baso Urat';
    if (p.name === 'Bakso Mercon') oldName = 'Baso Mercon';
    if (p.name === 'Mie Ayam Biasa') oldName = 'Mie Ayam Original';
    if (p.name === 'Mie Ayam Bakso Kecil') oldName = 'Mie Ayam Baso';
    if (p.name === 'Es Teh Manis') oldName = 'Es Teh';
    if (p.name === 'Es Jeruk Peras') oldName = 'Es Jeruk';

    let product = await prisma.product.findFirst({ where: { name: p.name } });
    
    if (!product && oldName !== p.name) {
       product = await prisma.product.findFirst({ where: { name: oldName } });
    }

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: p
      })
    } else {
      await prisma.product.create({
        data: p
      })
    }
  }

  // Delete leftover old products that are no longer in the new menu
  // (We mapped Baso Original -> Bakso Original but maybe we missed some or want to clean them)
  const validNames = productsData.map(p => p.name);
  const allProducts = await prisma.product.findMany();
  for (const p of allProducts) {
    if (!validNames.includes(p.name)) {
      try {
        await prisma.product.delete({ where: { id: p.id }});
        console.log(`Deleted deprecated product: ${p.name}`);
      } catch {
        console.log(`Could not delete ${p.name} as it might be referenced in orders. Marking as unavailable.`);
        await prisma.product.update({ where: { id: p.id }, data: { isAvailable: false } });
      }
    }
  }

  console.log('Seed database completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
