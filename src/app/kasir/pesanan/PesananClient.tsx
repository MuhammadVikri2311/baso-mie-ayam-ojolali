'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { confirmPayment } from './actions'
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar, 
  Banknote, 
  QrCode, 
  CreditCard,
  UtensilsCrossed,
  Check,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import type { Order, OrderItem, Payment, Product, User as PrismaUser } from '@prisma/client'

type KasirOrderItem = OrderItem & { product: Product }
export type KasirOrder = Order & {
  user: PrismaUser | null
  payment: Payment | null
  items: KasirOrderItem[]
}

export default function PesananClient({ initialOrders }: { initialOrders: KasirOrder[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; orderNumber: string } | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExecuteConfirm = async () => {
    if (!selectedOrder) return
    const { id, orderNumber } = selectedOrder

    setLoading(id)
    setFeedbackMessage(null)

    try {
      const result = await confirmPayment(id)
      if (result?.error) {
        setFeedbackMessage({ type: 'error', text: result.error })
      } else {
        setFeedbackMessage({ 
          type: 'success', 
          text: `Pesanan #${orderNumber} berhasil diselesaikan!` 
        })
        setIsConfirmOpen(false)
        setSelectedOrder(null)
        router.refresh()
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Terjadi kegagalan koneksi ke server.' })
    } finally {
      setLoading(null)
    }
  }

  // 1. Deduplikasi pesanan berdasarkan ID unik agar tidak ada duplikasi data saat polling real-time
  // 2. Prioritas status: MENUNGGU (0) paling atas, status aktif lainnya (1), SELESAI (2)
  // 3. Di dalam kelompok status yang sama: urutkan waktu pembuatan (createdAt) descending (paling baru di paling atas)
  const sortedOrders = useMemo(() => {
    if (!initialOrders || !Array.isArray(initialOrders)) return []

    const uniqueMap = new Map<string, KasirOrder>()
    for (const order of initialOrders) {
      if (order && order.id) {
        uniqueMap.set(order.id, order)
      }
    }

    const getStatusPriority = (status: string) => {
      if (status === 'MENUNGGU') return 0
      if (status === 'DIPROSES' || status === 'SIAP') return 1
      if (status === 'SELESAI') return 2
      return 3
    }

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const priorityDiff = getStatusPriority(a.orderStatus) - getStatusPriority(b.orderStatus)
      if (priorityDiff !== 0) return priorityDiff

      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeB - timeA // Paling baru di paling atas
    })
  }, [initialOrders])

  const getPaymentMethodIcon = (method?: string | null) => {
    switch (method) {
      case 'QRIS':
        return <QrCode className="w-3.5 h-3.5" />
      case 'TRANSFER':
        return <CreditCard className="w-3.5 h-3.5" />
      default:
        return <Banknote className="w-3.5 h-3.5" />
    }
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="bg-stone-50/70 border border-stone-200/80 rounded-3xl p-10 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-900">Semua Transaksi Sudah Dibayar</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Tidak ada pesanan yang menunggu pembayaran. Pesanan baru yang dibuat pelanggan akan otomatis tampil di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {sortedOrders.map((order) => {
        const isProcessing = loading === order.id
        return (
          <div 
            key={order.id} 
            className="bg-white border-2 border-orange-100/80 hover:border-orange-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Header Pesanan */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-extrabold text-sm text-stone-900 bg-stone-100 px-3 py-1 rounded-xl">
                    #{order.orderNumber}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3" /> {order.orderStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1.5">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    {order.customerName || order.user?.name || 'Pelanggan Tamu'}
                  </span>
                  {order.customerPhone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {order.customerPhone}
                      </span>
                    </>
                  )}
                  {order.customerEmail && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">
                        <Mail className="w-3 h-3 text-stone-400" />
                        {order.customerEmail}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Status & Metode Bayar */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 uppercase">
                  {getPaymentMethodIcon(order.payment?.paymentMethod)}
                  {order.payment?.paymentMethod || 'CASH'}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Daftar Item Menu */}
            <div className="py-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Item Menu Dipesan ({order.items.reduce((acc, i) => acc + i.quantity, 0)} Porsi)
              </p>
              <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden bg-stone-50/50">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{item.product.name}</span>
                        <span className="text-xs font-extrabold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md">
                          ×{item.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Rp{item.price.toLocaleString('id-ID')} / porsi
                      </p>
                      {(item.noodleType || item.spiceLevel || item.notes) && (
                        <div className="mt-1 text-xs text-orange-800 bg-orange-50 p-2 rounded-xl border border-orange-100 space-y-0.5">
                          {item.noodleType && <p>• Pilihan Mie: <span className="font-semibold">{item.noodleType}</span></p>}
                          {item.spiceLevel && <p>• Level Pedas: <span className="font-semibold">{item.spiceLevel}</span></p>}
                          {item.notes && <p>• Catatan: <span className="font-semibold">{item.notes}</span></p>}
                        </div>
                      )}
                    </div>
                    <div className="font-extrabold text-stone-900 sm:text-right">
                      Rp{item.subtotal.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Pembayaran & Tombol Konfirmasi */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">Total Tagihan Pembayaran</p>
                <p className="text-2xl font-black text-orange-600 tracking-tight">
                  Rp{order.totalAmount.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {order.orderStatus === 'MENUNGGU' && (
                  <button
                    onClick={() => {
                      setSelectedOrder({ id: order.id, orderNumber: order.orderNumber })
                      setIsConfirmOpen(true)
                    }}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {isProcessing ? 'Memproses...' : 'Selesai'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Modal Konfirmasi Selesai Pesanan */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        orderNumber={selectedOrder?.orderNumber}
        isLoading={Boolean(loading)}
        onClose={() => {
          if (!loading) {
            setIsConfirmOpen(false)
            setSelectedOrder(null)
          }
        }}
        onConfirm={handleExecuteConfirm}
      />
    </div>
  )
}
