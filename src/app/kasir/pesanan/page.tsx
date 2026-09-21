import { db } from '@/lib/db'
import PesananClient from './PesananClient'

export const dynamic = 'force-dynamic'

export default async function KasirPesananPage() {
  const orders = await db.order.findMany({
    where: {
      orderStatus: {
        in: ['MENUNGGU', 'DIPROSES', 'SIAP']
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      user: true,
      payment: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manajemen Pesanan</h1>
      <PesananClient initialOrders={orders} />
    </div>
  )
}
