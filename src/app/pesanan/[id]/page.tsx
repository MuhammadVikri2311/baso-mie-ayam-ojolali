import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, Package, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params

  try {
    const order = await db.order.findUnique({
      where: { id: id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    })

    if (!order) {
      return (
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Pesanan tidak ditemukan</h1>
          <Link href="/menu" className="text-orange-600 hover:underline mt-4 inline-block">Kembali ke Menu</Link>
        </div>
      )
    }

    // Cek apakah user yang login adalah pemilik pesanan, atau admin/kasir
    if (order.userId !== session.user.id && session.user.role === 'PELANGGAN') {
      redirect('/')
    }

    const statusConfig = {
      MENUNGGU: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, text: 'Menunggu Konfirmasi' },
      DIPROSES: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Package, text: 'Sedang Diproses' },
      SIAP: { color: 'text-orange-600', bg: 'bg-orange-50', icon: CheckCircle2, text: 'Pesanan Siap' },
      SELESAI: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, text: 'Selesai' },
      DIBATALKAN: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, text: 'Dibatalkan' },
    }

    const currentStatus = statusConfig[order.orderStatus as keyof typeof statusConfig]
    const StatusIcon = currentStatus.icon

    return (
      <div className="max-w-3xl mx-auto pb-12">
        <Link href={session.user.role === 'PELANGGAN' ? "/pesanan" : "/kasir/pesanan"} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-gray-500 mt-1">{order.orderNumber}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${currentStatus.bg} ${currentStatus.color}`}>
            <StatusIcon className="w-5 h-5" />
            {currentStatus.text}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Item Pesanan</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-[10px] font-medium">No Img</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Total Harga</span>
              <span className="font-bold text-lg text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Metode Pembayaran</span>
              <span className="font-medium text-gray-900">{order.payment?.paymentMethod === 'CASH' ? 'Bayar Langsung ke Kasir' : order.payment?.paymentMethod || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">Status Pembayaran</span>
              <span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                {order.paymentStatus === 'PAID' ? 'Lunas' : order.paymentStatus === 'PENDING' ? 'Belum Dibayar' : 'Gagal'}
              </span>
            </div>
          </div>
        </div>
        
        {session.user.role === 'PELANGGAN' && order.paymentStatus === 'PENDING' && order.orderStatus !== 'DIBATALKAN' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-orange-800 mb-2">Segera Lakukan Pembayaran</h3>
            <p className="text-orange-700 text-sm mb-4">
              Silakan lakukan pembayaran secara langsung di kasir untuk memproses pesanan ini.
            </p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan tidak valid</h1>
        <Link href="/menu" className="text-orange-600 hover:underline mt-4 inline-block">Kembali ke Menu</Link>
      </div>
    )
  }
}
