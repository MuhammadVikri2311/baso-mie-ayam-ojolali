import { Metadata } from 'next'
import { db } from '@/lib/db'
import { 
  FileText, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Layers,
  UtensilsCrossed
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Laporan Penjualan - Admin UMKM Ojolali',
  description: 'Rekapitulasi penjualan, omset, dan analisis produk terlaris Baso & Mie Ayam Ojolali',
}

export const dynamic = 'force-dynamic'

export default async function AdminLaporanPage() {
  const completedOrders = await db.order.findMany({
    where: { orderStatus: 'SELESAI', paymentStatus: 'PAID' },
    include: {
      items: {
        include: { 
          product: {
            include: { category: true }
          }
        }
      }
    }
  })

  let totalPendapatan = 0
  let totalProdukTerjual = 0
  const productSales: Record<string, { name: string; categoryName: string; qty: number; total: number }> = {}
  const categorySales: Record<string, { name: string; qty: number; total: number }> = {}

  for (const order of completedOrders) {
    totalPendapatan += order.totalAmount
    for (const item of order.items) {
      totalProdukTerjual += item.quantity
      const prodId = item.productId
      const catName = item.product.category?.name || 'Lainnya'

      // Product sales
      if (!productSales[prodId]) {
        productSales[prodId] = { 
          name: item.product.name, 
          categoryName: catName,
          qty: 0, 
          total: 0 
        }
      }
      productSales[prodId].qty += item.quantity
      productSales[prodId].total += item.subtotal

      // Category sales
      if (!categorySales[catName]) {
        categorySales[catName] = { name: catName, qty: 0, total: 0 }
      }
      categorySales[catName].qty += item.quantity
      categorySales[catName].total += item.subtotal
    }
  }

  const sortedProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty)
  const sortedCategories = Object.values(categorySales).sort((a, b) => b.total - a.total)
  const aov = completedOrders.length > 0 ? Math.round(totalPendapatan / completedOrders.length) : 0

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Analitik Bisnis
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Performa UMKM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Laporan & Analisis Penjualan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Rekapitulasi transaksi sukses, kontribusi omset per kategori, dan ranking menu terfavorit pelanggan.
          </p>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/30 border border-orange-100/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Total Omset Sukses</span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Rp{totalPendapatan.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-stone-500 mt-1">Dari pesanan berstatus Selesai & Lunas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 border border-blue-100/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Transaksi Sukses</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {completedOrders.length}
          </p>
          <p className="text-xs text-stone-500 mt-1">Pesanan selesai terlayani</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Produk Terjual</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {totalProdukTerjual} <span className="text-sm font-semibold text-stone-500">Porsi/Item</span>
          </p>
          <p className="text-xs text-stone-500 mt-1">Akumulasi seluruh menu</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/30 border border-purple-100/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Rata-rata Transaksi (AOV)</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Rp{aov.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-stone-500 mt-1">Nilai belanja rata-rata per transaksi</p>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Kontribusi Penjualan per Kategori
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Pangsa omset dan porsi penjualan berdasarkan kategori menu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedCategories.map((cat) => {
            const percentage = totalPendapatan > 0 ? Math.round((cat.total / totalPendapatan) * 100) : 0
            return (
              <div key={cat.name} className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900">{cat.name}</span>
                    <span className="text-xs font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
                      {percentage}%
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-stone-900 mt-2">
                    Rp{cat.total.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-stone-500">{cat.qty} porsi terjual</p>
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Peringkat Produk Terlaris
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Daftar menu dengan frekuensi pesanan dan pendapatan tertinggi
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Nama Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Porsi Terjual</th>
                  <th className="py-3.5 px-4 text-right">Total Pendapatan</th>
                  <th className="py-3.5 px-4 w-40 text-center">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {sortedProducts.map((p, i) => {
                  const contribution = totalPendapatan > 0 ? Math.round((p.total / totalPendapatan) * 100) : 0
                  return (
                    <tr key={i} className="hover:bg-orange-50/40 transition-colors group">
                      <td className="py-4 px-4 text-center font-bold">
                        {i === 0 ? (
                          <span className="text-xl">🥇</span>
                        ) : i === 1 ? (
                          <span className="text-xl">🥈</span>
                        ) : i === 2 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-xs text-stone-400 font-mono">#{i + 1}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-stone-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                          <Layers className="w-3 h-3 text-orange-500" />
                          {p.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-extrabold text-stone-900">
                        {p.qty} <span className="text-xs font-normal text-stone-500">porsi</span>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-stone-900">
                        Rp{p.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full"
                              style={{ width: `${contribution}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-stone-600 min-w-[28px] text-right">
                            {contribution}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sortedProducts.length === 0 && (
            <div className="py-12 px-4 text-center text-stone-500">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="font-bold text-stone-700">Belum Ada Transaksi Selesai</p>
              <p className="text-xs text-stone-400 mt-1">Laporan akan otomatis terakumulasi setelah pesanan berhasil diselesaikan dan dibayar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
