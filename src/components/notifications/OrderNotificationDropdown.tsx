'use client'

import { useEffect, useRef } from 'react'
import { ShoppingBag, CheckCheck, Clock, ArrowRight, User } from 'lucide-react'
import type { OrderNotificationItem } from '@/lib/orderNotificationStore'

interface DropdownProps {
  isOpen: boolean
  onClose: () => void
  orders: OrderNotificationItem[]
  unreadOrderIds: string[]
  onOrderClick: (orderId: string) => void
  onMarkAllAsRead: () => void
  targetPath: string
  role: 'admin' | 'kasir'
}

export default function OrderNotificationDropdown({
  isOpen,
  onClose,
  orders,
  unreadOrderIds,
  onOrderClick,
  onMarkAllAsRead,
  targetPath,
  role,
}: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = unreadOrderIds.length

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)
      if (diffMinutes < 1) return 'Baru saja'
      if (diffMinutes < 60) return `${diffMinutes} mnt lalu`
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'MENUNGGU':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200'
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-stone-50 to-orange-50/40 border-b border-stone-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-stone-900">Notifikasi Pesanan</h3>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-500 text-white shadow-xs">
              {unreadCount} baru
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600">
              Semua dibaca
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tandai Dibaca</span>
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
        {orders.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-stone-700">Belum Ada Pesanan Masuk</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Pesanan baru yang dibuat pelanggan akan otomatis tampil di sini.
            </p>
          </div>
        ) : (
          orders.slice(0, 10).map((order) => {
            const isUnread = unreadOrderIds.includes(order.id)
            return (
              <div
                key={order.id}
                onClick={() => {
                  onOrderClick(order.id)
                  onClose()
                }}
                className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-orange-50/60 ${
                  isUnread ? 'bg-orange-50/25' : 'bg-white'
                }`}
              >
                {/* Status Dot / Unread Indicator */}
                <div className="mt-1 flex-shrink-0">
                  {isUnread ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                    </span>
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-stone-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 truncate mb-1">
                    <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{order.customerName}</span>
                  </div>

                  <p className="text-[11px] text-stone-500 truncate mb-1.5">
                    {order.summaryText}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100/80">
                    <span className="text-xs font-extrabold text-orange-600">
                      Rp{order.totalAmount.toLocaleString('id-ID')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="p-2.5 bg-stone-50 border-t border-stone-200/80 text-center">
        <button
          onClick={() => {
            onClose()
            window.location.href = targetPath
          }}
          className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl text-xs font-bold text-stone-700 hover:text-orange-600 hover:bg-white transition shadow-2xs cursor-pointer"
        >
          <span>
            {role === 'admin' ? 'Buka Semua Pesanan Admin' : 'Buka Antrean Kasir'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
