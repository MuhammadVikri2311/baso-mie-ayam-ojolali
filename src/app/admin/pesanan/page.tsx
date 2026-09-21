import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminPesananPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      payment: true,
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Seluruh Pesanan</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">ID Pesanan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Tanggal</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Total</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Status Pesanan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Status Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{order.orderNumber}</td>
                <td className="py-3 px-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="py-3 px-4 text-gray-600">{order.user.name}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">Rp{order.totalAmount.toLocaleString('id-ID')}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    order.orderStatus === 'SELESAI' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'DIBATALKAN' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
