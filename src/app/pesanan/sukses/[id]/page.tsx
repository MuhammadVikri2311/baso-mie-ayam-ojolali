import { db } from '@/lib/db'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PesananSuksesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order = null
  try {
    order = await db.order.findUnique({
      where: { id },
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
  } catch {
    order = null
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pesanan tidak ditemukan</h1>
        <p className="text-gray-500 mb-6">Nomor pesanan ini tidak tersedia.</p>
        <Link
          href="/menu"
          className="inline-flex justify-center bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition"
        >
          Kembali ke Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-sm border border-stone-200/80">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pesanan Berhasil Dibuat!</h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 mb-6">
          Terima kasih, pesanan Anda telah tercatat di sistem kami.
        </p>

        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 text-left space-y-3 mb-6 border border-stone-200/60">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Nomor Pesanan</p>
            <p className="text-lg font-mono font-extrabold text-stone-900">#{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Nama Pelanggan</p>
            <p className="font-bold text-stone-900 text-sm">{order.customerName || order.user?.name || 'Pelanggan'}</p>
          </div>
          {order.customerPhone && (
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Nomor WhatsApp</p>
              <p className="font-semibold text-emerald-700 text-sm">{order.customerPhone}</p>
            </div>
          )}
          {order.customerEmail && (
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Email Konfirmasi</p>
              <p className="font-semibold text-stone-700 text-sm">{order.customerEmail}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Status Pesanan</p>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {order.orderStatus}
            </span>
          </div>

          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">
              Daftar Menu ({order.items.reduce((acc, i) => acc + i.quantity, 0)} Porsi)
            </p>
            <ul className="mt-1.5 space-y-1.5 text-xs text-stone-700 divide-y divide-stone-200/50">
              {order.items.map((item) => (
                <li key={item.id} className="pt-1.5 first:pt-0 flex justify-between items-start gap-2">
                  <div>
                    <span className="font-semibold text-stone-900">{item.product?.name || 'Menu'}</span>
                    <span className="text-orange-600 font-bold ml-1.5">×{item.quantity}</span>
                    {(item.noodleType || item.spiceLevel || item.notes) && (
                      <p className="text-[10px] text-stone-500">
                        {[item.noodleType, item.spiceLevel, item.notes].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-stone-900 flex-shrink-0">
                    Rp{item.subtotal.toLocaleString('id-ID')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 uppercase">Total Tagihan</span>
            <span className="text-xl font-black text-orange-600">
              Rp{order.totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Informasi Notifikasi Otomatis */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left mb-6 text-xs text-emerald-900 flex items-start gap-3">
          <div className="p-1.5 bg-emerald-100 rounded-xl text-emerald-700 mt-0.5 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-950">Pesanan Diproses Dapur & Kasir</p>
            <p className="text-emerald-800/80 mt-0.5 leading-relaxed">
              Detail pesanan Anda telah otomatis tercatat di sistem kami.
              {order.customerEmail ? ' Bukti pemesanan telah dikirimkan ke email Anda.' : ''}
              {order.customerPhone ? ' Notifikasi otomatis juga akan dikirim ke WhatsApp Anda saat pesanan selesai.' : ''}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/menu"
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 py-3.5 px-6 rounded-2xl font-bold text-sm transition text-center block active:scale-98"
          >
            Kembali ke Menu
          </Link>
        </div>
      </div>
    </div>
  )
}
