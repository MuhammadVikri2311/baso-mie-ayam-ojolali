import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    totalPendapatan,
    totalPesanan,
    totalPelanggan,
    totalMenu,
    pesananTerbaru,
  ] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true }
    }),
    db.order.count(),
    db.user.count({ where: { role: 'PELANGGAN' } }),
    db.product.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ])

  const pendapatan = totalPendapatan._sum.totalAmount || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <p className="text-orange-800 text-sm font-medium mb-1">Total Pendapatan</p>
          <p className="text-3xl font-bold text-orange-900">Rp{pendapatan.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <p className="text-blue-800 text-sm font-medium mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold text-blue-900">{totalPesanan}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <p className="text-green-800 text-sm font-medium mb-1">Total Pelanggan</p>
          <p className="text-3xl font-bold text-green-900">{totalPelanggan}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <p className="text-purple-800 text-sm font-medium mb-1">Total Menu</p>
          <p className="text-3xl font-bold text-purple-900">{totalMenu}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Pesanan Terbaru</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">ID Pesanan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Total</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {pesananTerbaru.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{p.orderNumber}</td>
                <td className="py-3 px-4 text-gray-600">{p.user.name}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">Rp{p.totalAmount.toLocaleString('id-ID')}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    p.orderStatus === 'SELESAI' ? 'bg-green-100 text-green-700' :
                    p.orderStatus === 'DIBATALKAN' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.orderStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pesananTerbaru.length === 0 && (
          <p className="text-center text-gray-500 py-4">Belum ada pesanan.</p>
        )}
      </div>
    </div>
  )
}
