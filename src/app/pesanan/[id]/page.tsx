import { db } from '@/lib/db'
import { getAnySession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, Package, XCircle, MessageCircle } from 'lucide-react'
import { getWhatsAppOrderUrl } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAnySession()

  const { id } = await params

  let order = null;
  try {
    order = await db.order.findUnique({
      where: { id: id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        user: true,
      },
    })
  } catch (error) {
    // If id is not a valid UUID or other DB error occurs, gracefully handle as not found
    order = null;
  }

    if (!order) {
      return (
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Pesanan tidak ditemukan</h1>
          <Link href="/menu" className="text-orange-600 hover:underline mt-4 inline-block">Kembali ke Menu</Link>
        </div>
      )
    }

    // Cek otorisasi akses:
    // Staf (Admin & Kasir) memiliki akses ke seluruh pesanan.
    // Pesanan guest dapat dilihat langsung melalui link ID resi.
    // Pelanggan terdaftar hanya boleh melihat pesanannya sendiri atau pesanan guest yang link-nya mereka pegang.
    const isGuestOrder = !order.userId || order.user?.email === 'guest@ojolali.com'
    const isOwner = session?.user?.id === order.userId

    if (session?.user?.role === 'PELANGGAN' && !isOwner && !isGuestOrder) {
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

    const whatsappUrl = getWhatsAppOrderUrl({
      orderNumber: order.orderNumber,
      customerName: order.customerName || order.user?.name,
      customerPhone: order.customerPhone,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.payment?.paymentMethod,
      totalAmount: order.totalAmount,
      items: order.items.map((it) => ({
        name: it.product.name,
        quantity: it.quantity,
        price: it.price,
        subtotal: it.subtotal,
        noodleType: it.noodleType,
        spiceLevel: it.spiceLevel,
        notes: it.notes,
      })),
    })

    return (
      <div className="max-w-3xl mx-auto pb-12">
        <Link href={session?.user?.role === 'ADMIN' || session?.user?.role === 'KASIR' ? "/kasir/transaksi" : "/menu"} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-gray-500 mt-1">Nomor: {order.orderNumber}</p>
            <p className="text-gray-700 font-medium mt-1">Nama Pelanggan: {order.customerName || 'Pelanggan'}</p>
            {order.customerPhone && (
              <p className="text-emerald-700 text-sm font-medium mt-0.5">WhatsApp: {order.customerPhone}</p>
            )}
            {order.customerEmail && (
              <p className="text-stone-500 text-sm mt-0.5">Email: {order.customerEmail}</p>
            )}
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
                      {(item.noodleType || item.spiceLevel || item.notes) && (
                        <div className="mt-1 text-xs text-gray-600 space-y-0.5 border-t border-gray-100 pt-1">
                          {item.noodleType && <p><span className="font-medium text-gray-800">Mie:</span> {item.noodleType}</p>}
                          {item.spiceLevel && <p><span className="font-medium text-gray-800">Pedas:</span> {item.spiceLevel}</p>}
                          {item.notes && <p><span className="font-medium text-gray-800">Catatan:</span> {item.notes}</p>}
                        </div>
                      )}
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

        {/* Notifikasi Pesanan via WhatsApp */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 mb-6 text-center">
          <p className="text-xs text-emerald-800 font-semibold mb-3">
            Kirimkan rincian pesanan ini ke WhatsApp Kasir / Admin Baso & Mie Ayam Ojolali:
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Kirim Notifikasi Pesanan via WhatsApp</span>
          </a>
          <p className="text-[11px] text-emerald-700 mt-2">
            Klik tombol di atas untuk membuka aplikasi WhatsApp dengan pesan pesanan terisi otomatis. Anda dapat meninjau dan menekan tombol Kirim di WhatsApp.
          </p>
        </div>
        
        {(!session?.user || session.user.role === 'PELANGGAN') && order.paymentStatus === 'PENDING' && order.orderStatus !== 'DIBATALKAN' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-orange-800 mb-2">Segera Lakukan Pembayaran</h3>
            <p className="text-orange-700 text-sm mb-4">
              Silakan lakukan pembayaran secara langsung di kasir untuk memproses pesanan ini.
            </p>
          </div>
        )}
      </div>
    )
}
