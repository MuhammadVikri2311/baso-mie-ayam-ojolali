import { db } from '@/lib/db'
import { MenuClient } from './MenuClient'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const products = await db.product.findMany({
    where: {
      isAvailable: true,
    },
    include: {
      category: true,
    },
    orderBy: {
      name: 'asc'
    }
  })

  const categories = await db.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daftar Menu</h1>
        <p className="text-gray-500 mt-2">Pilih sajian lezat yang Anda inginkan</p>
      </div>
      
      <MenuClient products={products} categories={categories} />
    </div>
  )
}
