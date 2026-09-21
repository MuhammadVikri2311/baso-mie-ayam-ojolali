import { db } from '@/lib/db'
import MenuClient from './MenuClient'

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

  return (
    <div>
      <MenuClient initialProducts={products} categories={categories} />
    </div>
  )
}
