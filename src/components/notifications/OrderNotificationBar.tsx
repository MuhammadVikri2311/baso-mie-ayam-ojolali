'use client'

import { useState, useEffect } from 'react'
import { Bell, Volume2, VolumeX, Radio, AlertCircle } from 'lucide-react'
import { useOrderNotification } from './useOrderNotification'
import OrderNotificationDropdown from './OrderNotificationDropdown'
import OrderToastNotification from './OrderToastNotification'

interface BarProps {
  role: 'admin' | 'kasir'
}

export default function OrderNotificationBar({ role }: BarProps) {
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    soundEnabled,
    autoplayBlocked,
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
      <header className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-3 sm:px-5 flex items-center justify-between gap-3 mb-2 min-h-[58px]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-100 animate-pulse" />
          <div className="h-4 w-40 bg-stone-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-stone-100 rounded-xl animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <>
      <OrderToastNotification role={role} />

      <header className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-3 sm:px-5 flex flex-col gap-2.5 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Real-time order monitoring status */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                  Pemantauan Pesanan Masuk (Real-time)
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
                {/* Status Suara Badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    soundEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  Suara: {soundEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                {role === 'admin'
                  ? 'Notifikasi pesanan baru untuk Administrator Ojolali'
                  : 'Notifikasi pesanan baru langsung ke meja Kasir'}
              </p>
            </div>
          </div>

          {/* Right: Sound toggle and Notification Bell */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto flex-wrap">
            {/* Tombol Aktif/Nonaktifkan Suara */}
            <button
              onClick={toggleSound}
              type="button"
              title={
                soundEnabled
                  ? 'Suara notifikasi aktif. Klik untuk menonaktifkan suara.'
                  : 'Suara nonaktif. Klik untuk mengaktifkan suara pesanan baru.'
              }
              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer active:scale-95 ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Suara Aktif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-amber-600 animate-pulse group-hover:scale-110 transition-transform" />
                  <span>Aktifkan Suara</span>
                </>
              )}
            </button>

            {/* Ikon Lonceng Notifikasi */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                type="button"
                aria-label="Lihat notifikasi pesanan baru"
                title="Notifikasi Pesanan"
                className={`relative p-2 rounded-xl transition-all duration-200 border cursor-pointer active:scale-95 ${
                  dropdownOpen
                    ? 'bg-orange-100/80 text-orange-700 border-orange-300'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                }`}
              >
                <Bell className="w-5 h-5" />

                {/* Badge Jumlah Pesanan Baru yang Belum Dilihat */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-black leading-none text-white bg-gradient-to-r from-orange-600 to-amber-600 rounded-full shadow-sm ring-2 ring-white animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
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
        </div>

        {/* Petunjuk Autoplay Browser (Tampil jika autoplay dibatasi browser) */}
        {autoplayBlocked && (
          <div className="p-2.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Browser membatasi suara otomatis:</strong> Klik tombol{' '}
                <strong>&quot;Aktifkan Suara&quot;</strong> di atas agar browser memberikan izin pemutaran audio saat pesanan baru masuk.
              </span>
            </div>
            <button
              onClick={toggleSound}
              type="button"
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer flex-shrink-0 self-start sm:self-auto"
            >
              Izinkan Suara
            </button>
          </div>
        )}
      </header>
    </>
  )
}
