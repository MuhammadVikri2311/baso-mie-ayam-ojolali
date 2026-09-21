import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminPelangganPage() {
  const users = await db.user.findMany({
    where: { role: 'PELANGGAN' },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daftar Pelanggan</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-gray-600">Nama</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Email</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Jumlah Pesanan</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Bergabung Sejak</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{u.name}</td>
                <td className="py-3 px-4 text-gray-600">{u.email}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{u._count.orders} pesanan</td>
                <td className="py-3 px-4 text-gray-600">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
