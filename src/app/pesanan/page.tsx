import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PesananPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const activeOrders = await db.order.findMany({
    where: {
      userId: session.user.id,
      orderStatus: {
        notIn: ['SELESAI', 'DIBATALKAN']
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
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Aktif</h1>
          <p className="text-gray-500 mt-2">Daftar pesanan Anda yang sedang berlangsung</p>
        </div>
        <Link href="/riwayat" className="text-orange-600 font-medium hover:text-orange-700">
          Lihat Riwayat &rarr;
        </Link>
      </div>

      {activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-orange-50 p-4 rounded-full inline-block mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pesanan Aktif</h2>
          <p className="text-gray-500 mb-6">Anda belum memiliki pesanan yang sedang diproses.</p>
          <Link href="/menu" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition">
            Pesan Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {activeOrders.map((order) => (
            <Link href={`/pesanan/${order.id}`} key={order.id} className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.orderStatus === 'MENUNGGU' ? 'bg-yellow-100 text-yellow-700' :
                  order.orderStatus === 'DIPROSES' ? 'bg-blue-100 text-blue-700' :
                  order.orderStatus === 'SIAP' ? 'bg-orange-100 text-orange-700' : ''
                }`}>
                  {order.orderStatus}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  {order.items.length} item • Total: <span className="font-bold text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-orange-600 flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
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
