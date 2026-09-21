import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { History, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RiwayatPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const historyOrders = await db.order.findMany({
    where: {
      userId: session.user.id,
      orderStatus: {
        in: ['SELESAI', 'DIBATALKAN']
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Pesanan</h1>
          <p className="text-gray-500 mt-2">Daftar pesanan Anda yang sudah selesai atau dibatalkan</p>
        </div>
      </div>

      {historyOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Riwayat</h2>
          <p className="text-gray-500 mb-6">Anda belum memiliki pesanan yang selesai.</p>
          <Link href="/menu" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition">
            Pesan Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {historyOrders.map((order) => (
            <Link href={`/pesanan/${order.id}`} key={order.id} className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition group opacity-75 hover:opacity-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.orderStatus === 'SELESAI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {order.orderStatus}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  {order.items.length} item • Total: <span className="font-bold text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-gray-500 flex items-center gap-1 font-medium group-hover:text-gray-800 transition">
                  Detail <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
