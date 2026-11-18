'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { confirmPayment } from '@/app/kasir/pesanan/actions'
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  X, 
  Clock, 
  CheckCircle2, 
  Calendar,
  DollarSign
} from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'

export interface AdminOrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  subtotal: number
  noodleType: string | null
  spiceLevel: string | null
  notes: string | null
  product: {
    id: string
    name: string
    price: number
  }
}

export interface AdminOrder {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  createdAt: Date | string
  updatedAt: Date | string
  user?: {
    id: string
    name: string
    email: string
  } | null
  payment: {
    paymentMethod: string
    paymentStatus: string
    amount: number
    paidAt: Date | string | null
  } | null
  items: AdminOrderItem[]
}

interface Props {
  initialOrders: AdminOrder[]
}

export default function PesananAdminClient({ initialOrders }: Props) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null)
  const [selectedConfirmOrder, setSelectedConfirmOrder] = useState<{ id: string; orderNumber: string } | null>(null)

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        q === '' ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.customerName && order.customerName.toLowerCase().includes(q)) ||
        (order.user?.name && order.user.name.toLowerCase().includes(q)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(q))

      const matchOrderStatus =
        orderStatusFilter === 'ALL' || order.orderStatus === orderStatusFilter

      const matchPaymentStatus =
        paymentStatusFilter === 'ALL' || order.paymentStatus === paymentStatusFilter

      return matchSearch && matchOrderStatus && matchPaymentStatus
    })
  }, [initialOrders, searchQuery, orderStatusFilter, paymentStatusFilter])

  // Summary statistics
  const totalOrders = initialOrders.length
  const totalPending = initialOrders.filter((o) => o.orderStatus === 'MENUNGGU').length
  const totalCompleted = initialOrders.filter((o) => o.orderStatus === 'SELESAI').length
  const totalRevenue = initialOrders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((acc, o) => acc + o.totalAmount, 0)

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'MENUNGGU':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Transaksi & Antrean
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Monitoring Real-Time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Seluruh Pesanan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Riwayat dan status pesanan masuk dari pelanggan online maupun transaksi kasir di tempat.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50/70 to-white p-4 rounded-2xl border border-blue-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Pesanan</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalOrders}</p>
            <p className="text-xs text-stone-500 mt-0.5">Semua transaksi tercatat</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-white p-4 rounded-2xl border border-amber-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pesanan Menunggu</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalPending}</p>
            <p className="text-xs text-stone-500 mt-0.5">Antrean belum selesai</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pesanan Selesai</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalCompleted}</p>
            <p className="text-xs text-stone-500 mt-0.5">Berhasil disajikan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50/70 to-white p-4 rounded-2xl border border-orange-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Omset Terverifikasi</p>
            <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
              Rp{totalRevenue.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Dari pesanan terbayar (PAID)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor pesanan, nama pelanggan, email..."
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

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
          >
            <option value="ALL">Semua Status Pesanan</option>
            <option value="MENUNGGU">MENUNGGU</option>
            <option value="SELESAI">SELESAI</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="PAID">PAID (Lunas)</option>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="FAILED">FAILED (Gagal)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4">No. Pesanan</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status Pesanan</th>
                <th className="py-3.5 px-4">Pembayaran</th>
                <th className="py-3.5 px-4 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-orange-50/40 transition-colors group">
                  <td className="py-4 px-4 font-mono font-bold text-xs text-stone-900">
                    <span className="bg-stone-100 px-2.5 py-1 rounded-lg">
                      #{order.orderNumber}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-stone-900">
                      {order.customerName || order.user?.name || 'Pelanggan Tamu'}
                    </p>
                    <p className="text-xs text-stone-400">{order.customerEmail || order.user?.email || '-'}</p>
                  </td>
                  <td className="py-4 px-4 font-extrabold text-stone-900">
                    Rp{order.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getOrderStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setDetailOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 px-4 text-center">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-stone-900">Pesanan Tidak Ditemukan</h3>
            <p className="text-sm text-stone-500 mt-1">
              Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Rincian Pesanan</span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-0.5">
                  #{detailOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Customer & Info box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                <div>
                  <p className="text-stone-400 font-semibold uppercase text-[10px]">Pelanggan</p>
                  <p className="font-bold text-stone-900 mt-0.5">{detailOrder.customerName || detailOrder.user?.name || 'Pelanggan Tamu'}</p>
                  <p className="text-stone-500">{detailOrder.customerEmail || detailOrder.user?.email || '-'}</p>
                  {detailOrder.customerPhone && (
                    <p className="text-emerald-700 font-medium mt-0.5">WA: {detailOrder.customerPhone}</p>
                  )}
                  {detailOrder.customerEmail && (
                    <p className="text-stone-600 font-medium mt-0.5">Email: {detailOrder.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p className="text-stone-400 font-semibold uppercase text-[10px]">Waktu Pesan</p>
                  <p className="font-bold text-stone-900 mt-0.5">
                    {new Date(detailOrder.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 font-semibold uppercase text-[10px]">Status Pesanan</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${getOrderStatusBadge(detailOrder.orderStatus)}`}>
                    {detailOrder.orderStatus}
                  </span>
                </div>
                <div>
                  <p className="text-stone-400 font-semibold uppercase text-[10px]">Status Pembayaran</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${getPaymentStatusBadge(detailOrder.paymentStatus)}`}>
                    {detailOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Item Menu Dipesan</p>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-2xl overflow-hidden bg-white">
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-start justify-between text-xs">
                      <div>
                        <p className="font-bold text-stone-900">{item.product.name}</p>
                        <p className="text-stone-500">
                          {item.quantity} × Rp{item.price.toLocaleString('id-ID')}
                        </p>
                        {(item.noodleType || item.spiceLevel || item.notes) && (
                          <div className="mt-1 text-[11px] text-orange-700 bg-orange-50/70 p-1.5 rounded-lg border border-orange-100">
                            {item.noodleType && <span>Mie: {item.noodleType} </span>}
                            {item.spiceLevel && <span>• Pedas: {item.spiceLevel} </span>}
                            {item.notes && <span>• Catatan: {item.notes}</span>}
                          </div>
                        )}
                      </div>
                      <p className="font-extrabold text-stone-900">
                        Rp{item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                  <div className="p-3 bg-stone-50 flex items-center justify-between text-sm font-bold text-stone-900">
                    <span>Total Pembayaran</span>
                    <span className="text-base text-orange-600">
                      Rp{detailOrder.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {detailOrder.orderStatus === 'MENUNGGU' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      setSelectedConfirmOrder({ id: detailOrder.id, orderNumber: detailOrder.orderNumber })
                    }}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan Pesanan</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition shadow-xs cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom React Modal Konfirmasi Selesai Pesanan */}
      <ConfirmModal
        isOpen={Boolean(selectedConfirmOrder)}
        orderNumber={selectedConfirmOrder?.orderNumber}
        isLoading={isUpdating}
        onClose={() => {
          if (!isUpdating) setSelectedConfirmOrder(null)
        }}
        onConfirm={async () => {
          if (!selectedConfirmOrder) return
          setIsUpdating(true)
          try {
            await confirmPayment(selectedConfirmOrder.id)
            setSelectedConfirmOrder(null)
            setDetailOrder(null)
            router.refresh()
          } finally {
            setIsUpdating(false)
          }
        }}
      />
    </div>
  )
}
