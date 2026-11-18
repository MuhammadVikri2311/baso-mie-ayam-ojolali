import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/auth'
import { db } from '@/lib/db'
import PesananClient from '../pesanan/PesananClient'
import { Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kasir & Transaksi - Baso & Mie Ayam Ojolali',
  description: 'Kelola pesanan masuk dan konfirmasi pembayaran pelanggan',
}

export const dynamic = 'force-dynamic'

export default async function KasirTransaksiPage() {
  const session = await getStaffSession()
  if (!session?.user) {
    redirect('/kasir/login')
  }
  if (session.user.role === 'PELANGGAN') {
    redirect('/')
  }

  // Hanya ambil transaksi yang masih MENUNGGU, urutkan dari yang paling baru ke paling lama (descending)
  const pendingPayments = await db.order.findMany({
    where: {
      orderStatus: 'MENUNGGU'
    },
    orderBy: {
      createdAt: 'desc'
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Antrean Kasir
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Konfirmasi & Selesaikan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Kasir / Transaksi
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Halaman khusus untuk meninjau rincian pesanan baru dan menyelesaikan pesanan pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{pendingPayments.length} Pesanan Menunggu</span>
        </div>
      </div>

      <PesananClient initialOrders={pendingPayments} />
    </div>
  )
}
