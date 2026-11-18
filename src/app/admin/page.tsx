import { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  Layers, 
  ArrowUpRight, 
  ChevronRight, 
  Utensils, 
  CreditCard, 
  FileText
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Admin - Baso & Mie Ayam Ojolali',
  description: 'Panel ikhtisar operasional dan penjualan Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    totalPendapatan,
    totalPesanan,
    totalPelanggan,
    totalMenu,
    totalKategori,
    pesananMenunggu,
    pesananSelesai,
    pesananTerbaru,
  ] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true }
    }),
    db.order.count(),
    db.user.count({ where: { role: 'PELANGGAN' } }),
    db.product.count(),
    db.category.count(),
    db.order.count({
      where: {
        orderStatus: 'MENUNGGU',
      }
    }),
    db.order.count({ where: { orderStatus: 'SELESAI' } }),
    db.order.findMany({
      take: 6,
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

  const pendapatan = totalPendapatan._sum.totalAmount || 0

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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 sm:p-8 text-white shadow-lg shadow-orange-500/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-3">
            <Utensils className="w-3.5 h-3.5" />
            <span>Sistem Administrasi UMKM Ojolali</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Dashboard Admin
          </h1>
          <p className="mt-2 text-sm sm:text-base text-orange-100 font-medium">
            Pantau performa penjualan harian, kelola stok menu dan kategori, serta awasi pesanan pelanggan secara real-time.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/kategori"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-orange-700 font-bold text-xs hover:bg-orange-50 transition shadow-xs"
            >
              <Layers className="w-4 h-4 text-orange-600" /> Kelola Kategori
            </Link>
            <Link
              href="/admin/menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition"
            >
              <Package className="w-4 h-4" /> Kelola Menu Makanan
            </Link>
            <Link
              href="/kasir"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition"
            >
              <CreditCard className="w-4 h-4" /> Buka Dashboard Kasir
            </Link>
          </div>
        </div>
        
        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pendapatan */}
        <div className="bg-gradient-to-br from-orange-50/60 to-white p-5 rounded-2xl border border-orange-200/70 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Total Pendapatan</span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Rp{pendapatan.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">Status Paid</span> dari transaksi terverifikasi
            </p>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-gradient-to-br from-blue-50/60 to-white p-5 rounded-2xl border border-blue-200/70 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Pesanan</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {totalPesanan}
            </p>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">{pesananMenunggu} menunggu</span> • 
              <span className="text-emerald-600 font-bold">{pesananSelesai} selesai</span>
            </p>
          </div>
        </div>

        {/* Pelanggan */}
        <div className="bg-gradient-to-br from-emerald-50/60 to-white p-5 rounded-2xl border border-emerald-200/70 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pelanggan Terdaftar</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {totalPelanggan}
            </p>
            <p className="text-xs text-stone-500 mt-1">Akun pelanggan aktif</p>
          </div>
        </div>

        {/* Menu & Kategori */}
        <div className="bg-gradient-to-br from-purple-50/60 to-white p-5 rounded-2xl border border-purple-200/70 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Katalog Toko</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {totalMenu} <span className="text-base font-semibold text-stone-500">Menu</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Terbagi dalam <span className="font-bold text-orange-600">{totalKategori} Kategori</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/kategori"
          className="group p-4 rounded-2xl bg-stone-50/60 hover:bg-orange-50/60 border border-stone-200/80 hover:border-orange-200 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition">Kategori Menu</p>
              <p className="text-xs text-stone-500">{totalKategori} kategori terdaftar</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/menu"
          className="group p-4 rounded-2xl bg-stone-50/60 hover:bg-orange-50/60 border border-stone-200/80 hover:border-orange-200 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition">Daftar Menu</p>
              <p className="text-xs text-stone-500">{totalMenu} item makanan & minuman</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/laporan"
          className="group p-4 rounded-2xl bg-stone-50/60 hover:bg-orange-50/60 border border-stone-200/80 hover:border-orange-200 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition">Laporan & Rekap</p>
              <p className="text-xs text-stone-500">Statistik produk terlaris & omset</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Pesanan Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Transaksi yang baru masuk dari pelanggan dan kasir
            </p>
          </div>
          <Link
            href="/admin/pesanan"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <span>Lihat Semua Pesanan</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4">No. Pesanan</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Menu Dipesan</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status Pesanan</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {pesananTerbaru.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0)

                  return (
                    <tr key={order.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold font-mono text-xs text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-stone-900">
                        {order.customerName || order.user?.name || 'Pelanggan Tamu'}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-600">
                        <span className="font-medium text-stone-800">{itemCount} item</span>
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
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
              <p className="text-xs text-stone-400 mt-1">Pesanan dari kasir atau pelanggan akan otomatis muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
