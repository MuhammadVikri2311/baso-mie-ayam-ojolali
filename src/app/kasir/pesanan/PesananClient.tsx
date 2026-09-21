'use client'

import { useState } from 'react'
import { updateOrderStatus, confirmPayment, updatePaymentStatus } from './actions'
import { Loader2, CheckCircle, RefreshCcw } from 'lucide-react'

export default function PesananClient({ initialOrders }: { initialOrders: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setLoading(orderId)
    const result = await updateOrderStatus(orderId, status)
    setLoading(null)
    if (result?.error) {
      alert(result.error)
    }
  }

  const handleUpdatePaymentStatus = async (orderId: string, status: any) => {
    setLoading(orderId)
    const result = await updatePaymentStatus(orderId, status)
    setLoading(null)
    if (result?.error) {
      alert(result.error)
    }
  }

  const handleConfirmPayment = async (orderId: string) => {
    if (!window.confirm('Apakah Anda yakin pelanggan sudah membayar pesanan ini?')) {
      return
    }
    setLoading(orderId)
    const result = await confirmPayment(orderId)
    setLoading(null)
    
    if (result?.error) {
      alert(result.error)
    } else {
      alert('Pembayaran berhasil dikonfirmasi!')
    }
  }

  if (initialOrders.length === 0) {
    return <p className="text-gray-500 py-4">Tidak ada pesanan aktif.</p>
  }

  return (
    <div className="space-y-6">
      {initialOrders.map(order => (
        <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
              <p className="text-sm text-gray-500">{order.user.name} • {new Date(order.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {order.orderStatus}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
          
          <div className="border-t border-b border-gray-100 py-4 mb-4 space-y-2">
            {order.items.map((item: any) => (
               <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                <span className="font-medium">Rp{item.subtotal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600 font-medium">Total Harga</span>
            <span className="font-bold text-lg text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-gray-50 rounded-xl">
            <div className="flex gap-4 w-full md:w-auto">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status Pesanan</label>
                <select 
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2"
                  value={order.orderStatus}
                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                  disabled={loading === order.id}
                >
                  <option value="MENUNGGU">Menunggu</option>
                  <option value="DIPROSES">Diproses</option>
                  <option value="SIAP">Siap Diambil</option>
                  <option value="SELESAI">Selesaikan</option>
                  <option value="DIBATALKAN">Batalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status Pembayaran</label>
                <select 
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2"
                  value={order.paymentStatus}
                  onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                  disabled={loading === order.id}
                >
                  <option value="PENDING">Belum Dibayar</option>
                  <option value="PAID">Sudah Dibayar</option>
                  <option value="FAILED">Gagal</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              {order.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => handleConfirmPayment(order.id)}
                  disabled={loading === order.id}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition disabled:opacity-50 w-full md:w-auto shadow-sm"
                >
                  {loading === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Konfirmasi Pembayaran ({order.payment?.paymentMethod})
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
