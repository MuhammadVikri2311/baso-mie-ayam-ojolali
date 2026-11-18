'use client'

import Link from 'next/link'
import { LayoutDashboard, CreditCard, History, Utensils, ChevronRight, Menu, X, Store } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import AutoRefresh from '@/components/AutoRefresh'
import OrderNotificationBar from '@/components/notifications/OrderNotificationBar'

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/kasir/login') return

    if (status === 'authenticated' && session?.user?.role === 'PELANGGAN') {
      router.replace('/')
    }
  }, [pathname, status, session, router])

  if (pathname === '/kasir/login') {
    return <>{children}</>
  }

  const isNavActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const navLinks = [
    { href: '/kasir', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/kasir/transaksi', label: 'Kasir / Transaksi', icon: CreditCard },
    { href: '/kasir/riwayat', label: 'Riwayat Transaksi', icon: History },
  ]

  const renderNavList = () => (
    <div className="space-y-1.5">
      <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-stone-400 uppercase">
        Menu Kasir
      </div>
      <nav className="space-y-1.5">
        {navLinks.map((item) => {
          const Icon = item.icon
          const active = isNavActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-stone-600 hover:text-orange-600 hover:bg-orange-50/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-stone-400 group-hover:text-orange-500'}`} />
                <span>{item.label}</span>
              </div>
              {active && <ChevronRight className="w-4 h-4 text-white/90" />}
            </Link>
          )
        })}
      </nav>

      <div className="pt-3 mt-3 border-t border-stone-100">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-stone-400 uppercase">
          Toko Pelanggan
        </div>
        <Link
          href="/menu"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:text-orange-600 hover:bg-orange-50/80 transition"
        >
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-stone-400 group-hover:text-orange-500 transition-transform group-hover:scale-110" />
            <span>Website Pelanggan</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-orange-500" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      <AutoRefresh intervalMs={4000} />

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-stone-200/80 shadow-xs mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-stone-900 leading-tight">Dashboard Kasir</h2>
            <p className="text-[11px] text-orange-600 font-semibold">Baso & Mie Ayam Ojolali</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-stone-900">Dashboard Kasir</h2>
                    <p className="text-[11px] text-stone-500">Baso & Mie Ayam Ojolali</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderNavList()}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar Kasir */}
      <aside className="hidden lg:flex flex-col w-64 bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 flex-shrink-0 h-fit">
        <div>
          {/* Header Brand */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-stone-100">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/25 flex-shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-base text-stone-900 tracking-tight">Dashboard Kasir</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                  POS
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">Baso & Mie Ayam Ojolali</p>
            </div>
          </div>

          {renderNavList()}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <OrderNotificationBar role="kasir" />
        <main className="flex-1 bg-white rounded-2xl shadow-xs border border-stone-200/80 p-5 sm:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
