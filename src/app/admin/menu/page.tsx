import { Metadata } from 'next'
import { db } from '@/lib/db'
import MenuClient from './MenuClient'

export const metadata: Metadata = {
  title: 'Manajemen Menu - Admin UMKM Ojolali',
  description: 'Kelola daftar menu makanan dan minuman Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminMenuPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    }),
    db.category.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  return <MenuClient initialProducts={products} categories={categories} />
}
