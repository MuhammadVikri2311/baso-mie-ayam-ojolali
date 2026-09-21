import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function KasirRiwayatPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Transaksi (Selesai)</h1>
      
      {historyOrders.length === 0 ? (
        <p className="text-gray-500 py-4">Belum ada transaksi selesai.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-gray-600">ID Pesanan</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Tanggal</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Total</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Metode</th>
              </tr>
            </thead>
            <tbody>
              {historyOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(order.createdAt).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-gray-600">{order.user.name}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">Rp{order.totalAmount.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-gray-600">{order.payment?.paymentMethod || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
