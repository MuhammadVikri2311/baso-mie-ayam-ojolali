'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, ArrowRight, User, ShoppingBag } from 'lucide-react'
import { useOrderNotificationStore } from '@/lib/orderNotificationStore'

interface ToastProps {
  role: 'admin' | 'kasir'
}

export default function OrderToastNotification({ role }: ToastProps) {
  const router = useRouter()
  const activeToastOrder = useOrderNotificationStore((state) => state.activeToastOrder)
  const dismissToast = useOrderNotificationStore((state) => state.dismissToast)
  const markAsRead = useOrderNotificationStore((state) => state.markAsRead)

  const targetPath = role === 'admin' ? '/admin/pesanan' : '/kasir/transaksi'

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!activeToastOrder) return
    const timer = setTimeout(() => {
      dismissToast()
    }, 8000)
    return () => clearTimeout(timer)
  }, [activeToastOrder, dismissToast])

  if (!activeToastOrder) return null

  const handleActionClick = () => {
    markAsRead(activeToastOrder.id)
    dismissToast()
    router.push(targetPath)
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-orange-400/90 ring-4 ring-orange-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
                  Pesanan Baru
                </span>
                <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                  #{activeToastOrder.orderNumber}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-stone-900 mt-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400 inline" />
                <span>{activeToastOrder.customerName}</span>
              </h4>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Preview Content */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="overflow-hidden pr-2">
            <span className="text-stone-500 truncate block text-[11px]">
              {activeToastOrder.summaryText}
            </span>
            <span className="font-black text-orange-600 text-sm">
              Rp{activeToastOrder.totalAmount.toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={handleActionClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <span>{role === 'kasir' ? 'Proses Bayar' : 'Lihat Detail'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
