'use client'

import { useState, useMemo } from 'react'
import { 
  Users, 
  Search, 
  ShoppingBag, 
  Calendar, 
  Mail, 
  X,
  UserCheck,
  TrendingUp,
  Award
} from 'lucide-react'

export interface AdminCustomer {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date | string
  _count: {
    orders: number
  }
}

interface Props {
  initialCustomers: AdminCustomer[]
}

export default function PelangganAdminClient({ initialCustomers }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return initialCustomers
    const q = searchQuery.toLowerCase().trim()
    return initialCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [initialCustomers, searchQuery])

  // Statistics
  const totalCustomers = initialCustomers.length
  const activeCustomers = initialCustomers.filter((c) => c._count.orders > 0).length
  const totalOrders = initialCustomers.reduce((acc, c) => acc + c._count.orders, 0)
  const topCustomer = [...initialCustomers].sort((a, b) => b._count.orders - a._count.orders)[0]

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Database Pengguna
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Pelanggan UMKM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Daftar Pelanggan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Data akun pelanggan terdaftar beserta riwayat keaktifan transaksi pemesanan mereka.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Total Pelanggan</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">{totalCustomers}</p>
            <p className="text-xs text-stone-500 mt-0.5">Akun terdaftar di sistem</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/30 border border-orange-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-orange-700 tracking-wide uppercase">Pelanggan Aktif</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">{activeCustomers}</p>
            <p className="text-xs text-stone-500 mt-0.5">Pernah melakukan pemesanan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/30 border border-purple-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-700 tracking-wide uppercase">Pelanggan Terbanyak</p>
            <p className="text-lg font-bold text-stone-900 mt-1 truncate max-w-[150px]">
              {topCustomer ? topCustomer.name : '-'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {topCustomer ? `${topCustomer._count.orders} pesanan selesai` : 'Belum ada transaksi'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan atau email..."
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-stone-500 self-center">
          Menampilkan <span className="text-stone-900 font-bold">{filteredCustomers.length}</span> dari {totalCustomers} pelanggan
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Frekuensi Belanja</th>
                <th className="py-3.5 px-4">Bergabung Sejak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredCustomers.map((customer, index) => {
                const initial = customer.name ? customer.name.charAt(0).toUpperCase() : 'P'
                return (
                  <tr key={customer.id} className="hover:bg-orange-50/40 transition-colors group">
                    <td className="py-4 px-4 text-center text-xs font-bold text-stone-400">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {initial}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{customer.name}</p>
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                            PELANGGAN
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono text-xs">{customer.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        customer._count.orders > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {customer._count.orders} Pesanan
                      </span>
                    </td>
                    <td className="py-4 px-4 text-stone-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-12 px-4 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-stone-900">Pelanggan Tidak Ditemukan</h3>
            <p className="text-sm text-stone-500 mt-1">
              Tidak ada pelanggan yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
