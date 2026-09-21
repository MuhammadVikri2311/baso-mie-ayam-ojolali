import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminLaporanPage() {
  const completedOrders = await db.order.findMany({
    where: { orderStatus: 'SELESAI', paymentStatus: 'PAID' },
    include: {
      items: {
        include: { product: true }
      }
    }
  })

  let totalPendapatan = 0
  let totalProdukTerjual = 0
  const productSales: Record<string, { name: string, qty: number, total: number }> = {}

  for (const order of completedOrders) {
    totalPendapatan += order.totalAmount
    for (const item of order.items) {
      totalProdukTerjual += item.quantity
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.product.name, qty: 0, total: 0 }
      }
      productSales[item.productId].qty += item.quantity
      productSales[item.productId].total += item.subtotal
    }
  }

  const sortedProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Laporan Penjualan</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <p className="text-orange-800 text-sm font-medium mb-1">Total Pendapatan Sukses</p>
          <p className="text-3xl font-bold text-orange-900">Rp{totalPendapatan.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <p className="text-blue-800 text-sm font-medium mb-1">Total Transaksi Sukses</p>
          <p className="text-3xl font-bold text-blue-900">{completedOrders.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <p className="text-green-800 text-sm font-medium mb-1">Total Produk Terjual</p>
          <p className="text-3xl font-bold text-green-900">{totalProdukTerjual}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Produk Terlaris</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">Nama Produk</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-center">Jumlah Terjual</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{p.name}</td>
                <td className="py-3 px-4 text-gray-900 font-medium text-center">{p.qty}</td>
                <td className="py-3 px-4 text-gray-900 font-medium text-right">Rp{p.total.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
