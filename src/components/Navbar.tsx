'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, Utensils, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import NavbarOrderNotification from './notifications/NavbarOrderNotification'
import { logoutAction } from '@/lib/authActions'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const cartItems = useCartStore((state) => state.items)
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // Cek apakah sedang berada di panel staff (admin atau kasir)
  const isAdmin = pathname?.startsWith('/admin')
  const isKasir = pathname?.startsWith('/kasir')
  const isStaffRoute = Boolean(isAdmin || isKasir)

  const toggleMenu = () => setIsOpen(!isOpen)

  const brandHref = isAdmin ? '/admin' : isKasir ? '/kasir' : '/'

  const handleLogout = async () => {
    const portal: 'admin' | 'kasir' | 'pelanggan' = isAdmin
      ? 'admin'
      : isKasir
      ? 'kasir'
      : session?.user?.role === 'ADMIN'
      ? 'admin'
      : session?.user?.role === 'KASIR'
      ? 'kasir'
      : 'pelanggan'

    const res = await logoutAction(portal)
    window.location.href = res.redirectTo || '/login'
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href={brandHref} className="flex-shrink-0 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="font-bold text-xl text-gray-900 hidden sm:block">UMKM Ojolali</span>
            </Link>

            {/* Badge Identitas Panel Staff */}
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                Dashboard Admin
              </span>
            )}
            {isKasir && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Dashboard Kasir
              </span>
            )}

            {isStaffRoute && (
              <Link
                href="/menu"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-orange-50 hover:text-orange-600 border border-stone-200 transition"
              >
                <Utensils className="w-3.5 h-3.5 text-orange-600" />
                <span>Lihat Menu Pelanggan</span>
              </Link>
            )}

            {/* Menu Navigasi Utama Publik */}
            {!isStaffRoute && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === '/'
                      ? 'border-orange-500 text-orange-600 font-bold'
                      : 'border-transparent text-gray-500 hover:border-orange-500 hover:text-orange-700'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/menu"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    pathname === '/menu'
                      ? 'border-orange-500 text-orange-600 font-bold'
                      : 'border-transparent text-gray-500 hover:border-orange-500 hover:text-orange-700'
                  }`}
                >
                  Menu
                </Link>

                {/* Tautan Cepat Staf jika sedang berada di halaman publik */}
                {session?.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 my-auto rounded-lg text-xs font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Kembali ke Dashboard Admin</span>
                  </Link>
                )}
                {session?.user?.role === 'KASIR' && (
                  <Link
                    href="/kasir"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 my-auto rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Kembali ke Dashboard Kasir</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Area Kanan Atas: Keranjang Pelanggan, Notifikasi Staff, Profil Pengguna, dan Tombol Logout */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Notifikasi Pesanan Baru untuk Admin dan Kasir */}
            {isStaffRoute && (
              <NavbarOrderNotification role={isAdmin ? 'admin' : 'kasir'} />
            )}

            {/* Keranjang belanja hanya ditampilkan di halaman publik pelanggan */}
            {!isStaffRoute && (
              <Link
                href="/keranjang"
                className={`relative p-2 transition-colors ${
                  pathname === '/keranjang' ? 'text-orange-600' : 'text-stone-500 hover:text-orange-600'
                }`}
              >
                <span className="sr-only">Keranjang</span>
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-600 rounded-full animate-pulse shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* Kontrol Akun Pengguna & Tombol Logout Kanan Atas */}
            {session?.user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
                <Link
                  href={session.user.role === 'PELANGGAN' ? '/profil' : isStaffRoute ? pathname : (session.user.role === 'ADMIN' ? '/admin' : '/kasir')}
                  className="text-right hidden md:block hover:opacity-80 transition cursor-pointer"
                >
                  <p className="text-xs font-bold text-stone-800 leading-tight">
                    {session.user.name || 'Pengguna'}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wide">
                    {session.user.role}
                  </span>
                </Link>

                {/* Tombol Logout Konsisten di Kanan Atas Panel */}
                <button
                  onClick={handleLogout}
                  title="Keluar / Logout"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition shadow-2xs cursor-pointer active:scale-95"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}
          </div>

          {/* Kontrol Mobile */}
          <div className="-mr-2 flex items-center gap-2 sm:hidden">
            {!isStaffRoute ? (
              <>
                <Link
                  href="/keranjang"
                  className={`relative p-2 mr-1 transition-colors ${
                    pathname === '/keranjang' ? 'text-orange-600' : 'text-stone-500 hover:text-orange-600'
                  }`}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-600 rounded-full animate-pulse shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </>
            ) : (
              /* Pada panel admin & kasir di mobile: notifikasi dan tombol logout */
              <div className="flex items-center gap-2">
                <NavbarOrderNotification role={isAdmin ? 'admin' : 'kasir'} />
                {session?.user && (
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu publik */}
      {!isStaffRoute && isOpen && (
        <div className="sm:hidden bg-white/95 backdrop-blur-md border-t border-stone-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                pathname === '/'
                  ? 'border-orange-500 text-orange-700 bg-orange-50 font-bold'
                  : 'border-transparent text-stone-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              onClick={() => setIsOpen(false)}
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                pathname === '/menu'
                  ? 'border-orange-500 text-orange-700 bg-orange-50 font-bold'
                  : 'border-transparent text-stone-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700'
              }`}
            >
              Menu
            </Link>

            {/* Mobile Nav Khusus Pelanggan */}
            {session?.user?.role === 'PELANGGAN' && (
              <>
                <Link
                  href="/profil"
                  onClick={() => setIsOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                    pathname === '/profil'
                      ? 'border-orange-500 text-orange-700 bg-orange-50 font-bold'
                      : 'border-transparent text-stone-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700'
                  }`}
                >
                  Profil Saya
                </Link>
              </>
            )}

            {/* Mobile Nav Staf jika membuka halaman publik */}
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block pl-3 pr-4 py-3 text-base font-bold text-orange-700 bg-orange-50 border-l-4 border-orange-500"
              >
                Ke Dashboard Admin
              </Link>
            )}
            {session?.user?.role === 'KASIR' && (
              <Link
                href="/kasir"
                onClick={() => setIsOpen(false)}
                className="block pl-3 pr-4 py-3 text-base font-bold text-amber-800 bg-amber-50 border-l-4 border-amber-500"
              >
                Ke Dashboard Kasir
              </Link>
            )}

            {/* Mobile Auth status & Tombol Logout */}
            {session?.user ? (
              <div className="pt-3 pb-2 border-t border-stone-200 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{session.user.name}</p>
                    <p className="text-xs text-stone-500">{session.user.email}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase">
                    {session.user.role}
                  </span>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar / Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 pb-2 border-t border-stone-200 px-4">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition"
                >
                  Masuk ke Akun
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
