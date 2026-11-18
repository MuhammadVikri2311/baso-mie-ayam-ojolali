import { Metadata } from 'next'
import { db } from '@/lib/db'
import PelangganAdminClient from './PelangganAdminClient'

export const metadata: Metadata = {
  title: 'Data Pelanggan - Admin UMKM Ojolali',
  description: 'Kelola data pelanggan terdaftar di Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminPelangganPage() {
  const users = await db.user.findMany({
    where: { role: 'PELANGGAN' },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return <PelangganAdminClient initialCustomers={users} />
}
