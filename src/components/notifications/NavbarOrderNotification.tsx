'use client'

import { useState, useEffect } from 'react'
import { Bell, Volume2, VolumeX } from 'lucide-react'
import { useOrderNotification } from './useOrderNotification'
import OrderNotificationDropdown from './OrderNotificationDropdown'

interface NavbarProps {
  role: 'admin' | 'kasir'
}

export default function NavbarOrderNotification({ role }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    soundEnabled,
    toggleSound,
    orders,
    unreadOrderIds,
    markAllAsRead,
    targetPath,
    handleOrderClick,
  } = useOrderNotification(role)

  const unreadCount = unreadOrderIds.length

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-8 h-8 rounded-xl bg-stone-100 animate-pulse" />
        <div className="w-8 h-8 rounded-xl bg-stone-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Sound toggle button */}
      <button
        onClick={toggleSound}
        type="button"
        title={
          soundEnabled
            ? 'Suara notifikasi aktif. Klik untuk nonaktifkan.'
            : 'Aktifkan bunyi notifikasi pesanan baru'
        }
        className={`p-2 rounded-xl transition border cursor-pointer active:scale-95 ${
          soundEnabled
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
        }`}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <VolumeX className="w-4 h-4 text-amber-600 animate-pulse" />
        )}
      </button>

      {/* Bell icon */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          type="button"
          title="Notifikasi Pesanan Baru"
          aria-label="Notifikasi Pesanan"
          className={`relative p-2 rounded-xl transition border cursor-pointer active:scale-95 ${
            dropdownOpen
              ? 'bg-orange-100 text-orange-700 border-orange-300'
              : 'text-stone-600 hover:text-orange-600 hover:bg-orange-50 border-stone-200/80'
          }`}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-black leading-none text-white bg-gradient-to-r from-orange-600 to-amber-600 rounded-full shadow-sm ring-2 ring-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <OrderNotificationDropdown
          isOpen={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
          orders={orders}
          unreadOrderIds={unreadOrderIds}
          onOrderClick={handleOrderClick}
          onMarkAllAsRead={markAllAsRead}
          targetPath={targetPath}
          role={role}
        />
      </div>
    </div>
  )
}
