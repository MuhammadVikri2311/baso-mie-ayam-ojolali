import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function KasirDashboard() {
  const [
    menunggu,
    diproses,
    siap,
    transaksiHariIni,
  ] = await Promise.all([
    db.order.count({ where: { orderStatus: 'MENUNGGU' } }),
    db.order.count({ where: { orderStatus: 'DIPROSES' } }),
    db.order.count({ where: { orderStatus: 'SIAP' } }),
    db.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        paymentStatus: 'PAID'
      }
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Kasir</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
          <p className="text-yellow-800 text-sm font-medium mb-1">Pesanan Menunggu</p>
          <p className="text-3xl font-bold text-yellow-900">{menunggu}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <p className="text-blue-800 text-sm font-medium mb-1">Sedang Diproses</p>
          <p className="text-3xl font-bold text-blue-900">{diproses}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <p className="text-orange-800 text-sm font-medium mb-1">Pesanan Siap</p>
          <p className="text-3xl font-bold text-orange-900">{siap}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <p className="text-green-800 text-sm font-medium mb-1">Transaksi Hari Ini</p>
          <p className="text-3xl font-bold text-green-900">{transaksiHariIni}</p>
        </div>
      </div>
    </div>
  )
}
