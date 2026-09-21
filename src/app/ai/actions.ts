'use server'

import { db } from '@/lib/db'

export async function askAI(prompt: string) {
  const query = prompt.toLowerCase()
  
  try {
    let products = []
    let message = ''

    if (query.includes('termurah') || query.includes('murah')) {
      products = await db.product.findMany({
        where: { isAvailable: true },
        orderBy: { price: 'asc' },
        take: 3,
        include: { category: true }
      })
      message = 'Berikut adalah rekomendasi menu dengan harga paling terjangkau:'
    } else if (query.includes('pedas') || query.includes('mercon')) {
      products = await db.product.findMany({
        where: { 
          isAvailable: true,
          OR: [
            { name: { contains: 'mercon' } },
            { name: { contains: 'pedas' } },
            { description: { contains: 'pedas' } },
            { description: { contains: 'sambal' } }
          ]
        },
        take: 3,
        include: { category: true }
      })
      message = 'Bagi Anda pecinta pedas, kami merekomendasikan menu berikut:'
    } else if (query.includes('mie ayam')) {
      products = await db.product.findMany({
        where: { 
          isAvailable: true,
          category: { name: { contains: 'Mie Ayam' } }
        },
        take: 3,
        include: { category: true }
      })
      message = 'Pilihan Mie Ayam terbaik kami untuk Anda:'
    } else if (query.includes('baso') || query.includes('bakso')) {
      products = await db.product.findMany({
        where: { 
          isAvailable: true,
          category: { name: { contains: 'Baso' } }
        },
        take: 3,
        include: { category: true }
      })
      message = 'Aneka varian Baso lezat yang wajib Anda coba:'
    } else if (query.includes('2 orang') || query.includes('dua orang')) {
      // Rekomendasi 2 makanan, 2 minuman
      const foods = await db.product.findMany({
        where: { isAvailable: true, category: { name: { in: ['Baso', 'Mie Ayam'] } } },
        take: 2,
        include: { category: true }
      })
      const drinks = await db.product.findMany({
        where: { isAvailable: true, category: { name: { contains: 'Minuman' } } },
        take: 2,
        include: { category: true }
      })
      products = [...foods, ...drinks]
      message = 'Untuk 2 orang, paket kombinasi makanan dan minuman ini sangat cocok:'
    } else {
      // Fallback random / popular
      products = await db.product.findMany({
        where: { isAvailable: true },
        take: 3,
        include: { category: true }
      })
      message = 'Berikut adalah beberapa menu spesial yang kami rekomendasikan untuk Anda hari ini:'
    }

    if (products.length === 0) {
      return { message: 'Maaf, informasi tersebut belum tersedia atau menu sedang habis.' }
    }

    return { message, products }
  } catch (error) {
    return { error: 'Maaf, layanan AI sedang mengalami gangguan.' }
  }
}
