import { Metadata } from 'next'
import { db } from '@/lib/db'
import PesananAdminClient from './PesananAdminClient'

export const metadata: Metadata = {
  title: 'Manajemen Pesanan - Admin UMKM Ojolali',
  description: 'Pantau seluruh pesanan pelanggan dan status pembayaran di Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminPesananPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
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

  return <PesananAdminClient initialOrders={orders} />
}
