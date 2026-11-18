import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  ArrowRight, 
  ShoppingBag, 
  ChefHat, 
  Calendar, 
  ArrowUpRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Kasir - Baso & Mie Ayam Ojolali',
  description: 'Ringkasan operasional dan transaksi kasir Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function KasirDashboard() {
  const session = await getStaffSession()
  if (!session?.user) {
    redirect('/kasir/login')
  }
  if (session.user.role === 'PELANGGAN') {
    redirect('/')
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [
    menungguPembayaran, 
    transaksiHariIni, 
    pendapatanHariIniAgg,
    pesananHariIniMenunggu,
    pesananHariIniSelesai,
    totalPesananHariIni,
    pesananTerbaru
  ] = await Promise.all([
    // 1. Pesanan menunggu (antrean aktif kasir)
    db.order.count({ 
      where: { 
        orderStatus: 'MENUNGGU'
      } 
    }),
    // 2. Transaksi lunas hari ini
    db.order.count({
      where: {
        createdAt: { gte: startOfDay },
        paymentStatus: 'PAID',
      },
    }),
    // 3. Omzet lunas hari ini
    db.order.aggregate({
      where: {
        createdAt: { gte: startOfDay },
        paymentStatus: 'PAID',
      },
      _sum: {
        totalAmount: true
      }
    }),
    // 4. Status pesanan hari ini breakdown (hanya MENUNGGU dan SELESAI)
    db.order.count({
      where: {
        createdAt: { gte: startOfDay },
        orderStatus: 'MENUNGGU'
      }
    }),
    db.order.count({
      where: {
        createdAt: { gte: startOfDay },
        orderStatus: 'SELESAI'
      }
    }),
    db.order.count({
      where: {
        createdAt: { gte: startOfDay },
        orderStatus: { in: ['MENUNGGU', 'SELESAI'] }
      }
    }),
    // 5. Ringkasan pesanan terbaru, maksimal 5 pesanan
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        payment: true,
        items: {
          include: { product: true }
        }
      }
    })
  ])

  const omsetHariIni = pendapatanHariIniAgg._sum.totalAmount || 0

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      case 'MENUNGGU':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/80'
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200/80'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/80'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Point of Sale
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Sistem Kasir Ojolali</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Dashboard Kasir
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Ringkasan jumlah pesanan menunggu pembayaran, transaksi hari ini, omzet, dan status operasional pesanan.
          </p>
        </div>

        <Link
          href="/kasir/transaksi"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 active:scale-98"
        >
          <CreditCard className="w-4 h-4" />
          <span>Buka Kasir / Transaksi</span>
          {menungguPembayaran > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-orange-700 text-xs font-black animate-pulse">
              {menungguPembayaran}
            </span>
          )}
        </Link>
      </div>

      {/* Primary Alert Notice Card */}
      {menungguPembayaran > 0 ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                  Ada {menungguPembayaran} Pesanan Menunggu Pembayaran!
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-200 text-amber-900 uppercase">
                  Perlu Tindakan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                Pelanggan sedang menunggu konfirmasi pembayaran. Buka menu <strong>Kasir / Transaksi</strong> untuk memproses dan mencetak struk.
              </p>
            </div>
          </div>
          <Link
            href="/kasir/transaksi"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/25 transition flex-shrink-0"
          >
            <span>Proses Pembayaran Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">Semua Transaksi Sudah Dibayar</h3>
              <p className="text-xs text-emerald-700 mt-0.5">Tidak ada antrean pesanan yang menunggu pembayaran saat ini.</p>
            </div>
          </div>
          <Link
            href="/kasir/transaksi"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline flex-shrink-0"
          >
            Lihat Antrean Kasir →
          </Link>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Menunggu Pembayaran */}
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/30 p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Menunggu Pembayaran</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
              {menungguPembayaran}
            </p>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              Konfirmasi di <Link href="/kasir/transaksi" className="font-bold text-orange-600 hover:underline">Kasir / Transaksi</Link>
            </p>
          </div>
        </div>

        {/* 2. Transaksi Lunas Hari Ini */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Transaksi Lunas Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
              {transaksiHariIni}
            </p>
            <p className="text-xs text-stone-500 mt-1">Pembayaran terverifikasi hari ini</p>
          </div>
        </div>

        {/* 3. Total Omset Hari Ini */}
        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/30 p-5 rounded-2xl border border-orange-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-800">Total Omzet Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-orange-950 tracking-tight">
              Rp{omsetHariIni.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-stone-500 mt-1">Dari {transaksiHariIni} pesanan lunas</p>
          </div>
        </div>

        {/* 4. Total Pesanan Hari Ini */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 p-5 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Total Pesanan Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
              {totalPesananHariIni}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Aktivitas pesanan keseluruhan hari ini
            </p>
          </div>
        </div>
      </div>

      {/* Status Pesanan Hari Ini Section */}
      <div className="bg-stone-50/60 rounded-2xl border border-stone-200/80 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <span>Status Pesanan Hari Ini</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Distribusi status operasional pesanan pelanggan yang masuk hari ini.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-200/70 text-stone-700 self-start sm:self-auto">
            Total {totalPesananHariIni} Pesanan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Menunggu */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Menunggu</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-amber-950 mt-2">{pesananHariIniMenunggu}</p>
            <p className="text-xs text-stone-400 mt-0.5">Antrean pesanan baru masuk</p>
          </div>

          {/* Selesai */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Selesai</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-emerald-950 mt-2">{pesananHariIniSelesai}</p>
            <p className="text-xs text-stone-400 mt-0.5">Pesanan berhasil diselesaikan</p>
          </div>
        </div>
      </div>

      {/* Ringkasan Pesanan Terbaru Section (Maksimal 5 Pesanan) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Ringkasan Pesanan Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Menampilkan maksimal 5 pesanan terbaru yang tercatat di sistem
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kasir/riwayat"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition"
            >
              <span>Riwayat Transaksi</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4">No. Pesanan</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Menu Dipesan</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status Pesanan</th>
                  <th className="py-3.5 px-4">Status Pembayaran</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {pesananTerbaru.map((order) => {
                  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0)
                  return (
                    <tr key={order.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold font-mono text-xs text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
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
                        <span className="font-medium text-stone-800">{totalItems} item</span>
                        {order.items[0] && (
                          <span className="text-stone-400 block truncate max-w-[180px]">
                            {order.items[0].product.name}
                            {order.items.length > 1 && ` +${order.items.length - 1} lainnya`}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-stone-900">
                        Rp{order.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getOrderStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {order.orderStatus === 'MENUNGGU' ? (
                            <Link
                              href="/kasir/transaksi"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-2xs"
                            >
                              <span>Selesaikan</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold px-1.5 py-1">
                              Selesai
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pesananTerbaru.length === 0 && (
            <div className="py-12 text-center text-stone-500">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">Belum Ada Pesanan</p>
              <p className="text-xs text-stone-400 mt-1">Pesanan yang dibuat pelanggan akan otomatis tampil di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
