import Link from 'next/link'
import { LayoutDashboard, Users, FileText, ShoppingBag, List, LogOut, Package } from 'lucide-react'
import LogoutButton from './LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-4">Admin Panel</h2>
        <nav className="space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/menu" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <Package className="w-5 h-5" /> Menu
          </Link>
          <Link href="/admin/kategori" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <List className="w-5 h-5" /> Kategori
          </Link>
          <Link href="/admin/pesanan" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <ShoppingBag className="w-5 h-5" /> Pesanan
          </Link>
          <Link href="/admin/pelanggan" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <Users className="w-5 h-5" /> Pelanggan
          </Link>
          <Link href="/admin/laporan" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <FileText className="w-5 h-5" /> Laporan
          </Link>
          <LogoutButton />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {children}
      </main>
    </div>
  )
}
