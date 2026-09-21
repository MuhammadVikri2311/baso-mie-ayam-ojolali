import { db } from '@/lib/db'
import { confirmPayment } from '../pesanan/actions'
import PesananClient from '../pesanan/PesananClient' // Kita bisa re-use client component ini karena fungsinya mirip

export const dynamic = 'force-dynamic'

export default async function KasirTransaksiPage() {
  // Hanya ambil transaksi yang masih PENDING (belum dibayar)
  const pendingPayments = await db.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      orderStatus: { not: 'DIBATALKAN' }
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      user: true,
      payment: true,
      items: {
        include: { product: true }
      }
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaksi Menunggu Pembayaran</h1>
      
      {pendingPayments.length === 0 ? (
        <p className="text-gray-500 py-4">Semua transaksi sudah dibayar.</p>
      ) : (
        <PesananClient initialOrders={pendingPayments} />
      )}
    </div>
  )
}
