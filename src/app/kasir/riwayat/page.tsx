import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { History, CheckCircle2, DollarSign, Calendar, CreditCard, Banknote, QrCode } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Riwayat Transaksi Kasir - Baso & Mie Ayam Ojolali',
  description: 'Daftar riwayat seluruh transaksi selesai di kasir Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function KasirRiwayatPage() {
  const session = await getStaffSession()
  if (!session?.user) {
    redirect('/kasir/login')
  }
  if (session.user.role === 'PELANGGAN') {
    redirect('/')
  }

  const historyOrders = await db.order.findMany({
    where: {
      orderStatus: 'SELESAI'
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

  const totalOmset = historyOrders.reduce((acc, o) => acc + o.totalAmount, 0)

  const getMethodBadge = (method?: string | null) => {
    switch (method) {
      case 'QRIS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <QrCode className="w-3 h-3" /> QRIS
          </span>
        )
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CreditCard className="w-3 h-3" /> TRANSFER
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3 h-3" /> CASH
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Arsip Transaksi
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Status Selesai</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Riwayat Transaksi Kasir
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Rekap transaksi yang telah lunas dan diselesaikan oleh staf kasir Ojolali.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 p-5 rounded-3xl border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Transaksi Selesai</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{historyOrders.length}</p>
            <p className="text-xs text-stone-500 mt-0.5">Semua riwayat pesanan selesai</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/30 p-5 rounded-3xl border border-orange-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-800">Total Omset Riwayat</p>
            <p className="text-2xl sm:text-3xl font-black text-orange-950 mt-1">
              Rp{totalOmset.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Akumulasi pembayaran terverifikasi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-stone-200/80 shadow-xs bg-white">
        {historyOrders.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <History className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-stone-900">Belum Ada Riwayat Transaksi</h3>
            <p className="text-sm text-stone-500 mt-1">
              Transaksi yang telah lunas dan diselesaikan akan tercatat secara otomatis di halaman ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4">No. Pesanan</th>
                  <th className="py-3.5 px-4">Waktu Selesai</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Item Dipesan</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {historyOrders.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0)
                  return (
                    <tr key={order.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-stone-900">
                        <span className="bg-stone-100 px-2.5 py-1 rounded-lg">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-stone-900">
                        {order.customerName || order.user?.name || 'Pelanggan Tamu'}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-600">
                        <span className="font-bold text-stone-800">{itemCount} porsi</span>
                        {order.items[0] && (
                          <span className="text-stone-400 block truncate max-w-[200px]">
                            {order.items[0].product.name}
                            {order.items.length > 1 && ` +${order.items.length - 1} lainnya`}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-stone-900">
                        Rp{order.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4">
                        {getMethodBadge(order.payment?.paymentMethod)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
