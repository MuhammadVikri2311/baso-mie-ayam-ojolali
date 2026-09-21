'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, User, Menu, LogOut, LayoutDashboard, Utensils } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store'

export default function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const cartItems = useCartStore((state) => state.items)
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="font-bold text-xl text-gray-900 hidden sm:block">UMKM Ojolali</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className="border-transparent text-gray-500 hover:border-orange-500 hover:text-orange-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link href="/menu" className="border-transparent text-gray-500 hover:border-orange-500 hover:text-orange-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Menu
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {session?.user?.role === 'PELANGGAN' || !session ? (
              <Link href="/keranjang" className="relative p-2 text-stone-500 hover:text-orange-600 transition-colors">
                <span className="sr-only">Keranjang</span>
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-600 rounded-full animate-pulse shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            ) : null}

            {session ? (
              <div className="flex items-center space-x-4">
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard Admin
                  </Link>
                )}
                {session.user.role === 'KASIR' && (
                  <Link href="/kasir" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard Kasir
                  </Link>
                )}
                <div className="flex items-center gap-2 group relative">
                  <User className="h-6 w-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 top-full">
                    {session.user.role === 'PELANGGAN' && (
                      <>
                        <Link href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil</Link>
                        <Link href="/pesanan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pesanan Saya</Link>
                        <Link href="/riwayat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Riwayat</Link>
                      </>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition">
                  Daftar
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {session?.user?.role === 'PELANGGAN' || !session ? (
              <Link href="/keranjang" className="relative p-2 mr-2 text-stone-500 hover:text-orange-600 transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-600 rounded-full animate-pulse shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            ) : null}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white/95 backdrop-blur-md border-t border-stone-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-stone-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-colors">Home</Link>
            <Link href="/menu" className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-stone-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-colors">Menu</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {session ? (
              <>
                <div className="flex items-center px-4 mb-2">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{session.user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{session.user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Dashboard Admin</Link>
                  )}
                  {session.user.role === 'KASIR' && (
                    <Link href="/kasir" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Dashboard Kasir</Link>
                  )}
                  {session.user.role === 'PELANGGAN' && (
                    <>
                      <Link href="/profil" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Profil</Link>
                      <Link href="/pesanan" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Pesanan Saya</Link>
                      <Link href="/riwayat" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Riwayat</Link>
                    </>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-1 flex flex-col px-4 gap-2">
                <Link href="/login" className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Login
                </Link>
                <Link href="/register" className="block w-full text-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
