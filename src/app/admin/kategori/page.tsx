import { Metadata } from 'next'
import { db } from '@/lib/db'
import KategoriClient from './KategoriClient'

export const metadata: Metadata = {
  title: 'Manajemen Kategori - Admin UMKM Ojolali',
  description: 'Kelola kategori menu Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminKategoriPage() {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return <KategoriClient initialCategories={categories} />
}
