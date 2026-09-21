import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, CreditCard, History } from 'lucide-react'
import LogoutButton from '../admin/LogoutButton'

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-4">Kasir Panel</h2>
        <nav className="space-y-1">
          <Link href="/kasir" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/kasir/pesanan" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <ShoppingBag className="w-5 h-5" /> Pesanan
          </Link>
          <Link href="/kasir/transaksi" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <CreditCard className="w-5 h-5" /> Transaksi
          </Link>
          <Link href="/kasir/riwayat" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-medium transition">
            <History className="w-5 h-5" /> Riwayat
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
