'use client'

import { useCartHydrated, useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createOrder, getStoreStatusAction } from './actions'
import { ArrowLeft, Loader2, Store, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const submittingRef = useRef(false)
  const hydrated = useCartHydrated()
  
  const [paymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [isStoreOpen, setIsStoreOpen] = useState(true)

  useEffect(() => {
    getStoreStatusAction().then((status) => {
      if (!status.isOpen) {
        setIsStoreOpen(false)
      }
    })
  }, [])

  useEffect(() => {
    if (hydrated && items.length === 0 && !loading) {
      router.push('/keranjang')
    }
  }, [items.length, hydrated, router, loading])

  if (!hydrated) return null

  if (items.length === 0 && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-600" />
        <p className="font-medium">Memproses pesanan...</p>
      </div>
    )
  }

  if (items.length === 0) return null

  const handleCheckout = async () => {
    if (submittingRef.current || loading) return

    if (!customerName.trim()) {
      setError('Mohon isi nama Anda terlebih dahulu.')
      return
    }

    if (!customerEmail.trim()) {
      setError('Mohon isi alamat email Anda terlebih dahulu.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail.trim())) {
      setError('Format email tidak valid (contoh: nama@email.com).')
      return
    }

    submittingRef.current = true
    setLoading(true)
    setError(null)

    const orderItems = items.map(i => ({
      id: i.id,
      quantity: i.quantity,
      noodleType: i.noodleType || null,
      spiceLevel: i.spiceLevel || null,
      notes: i.notes || null
    }))

    const result = await createOrder({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      items: orderItems,
      paymentMethod
    })

    if (result.error || !result.success || !result.orderId) {
      setError(result.error || 'Terjadi kesalahan saat memproses pesanan.')
      submittingRef.current = false
      setLoading(false)
      return
    }

    clearCart()
    router.replace(`/pesanan/sukses/${result.orderId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/keranjang" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      {!isStoreOpen && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Toko Sedang Tutup</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Maaf, toko sedang tutup dan belum menerima pesanan.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-4">Informasi Pelanggan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Email Pelanggan <span className="text-red-500">*</span>
                  <span className="text-xs text-stone-400 font-normal ml-1.5">(Untuk konfirmasi pesanan)</span>
                </label>
                <input 
                  type="email" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="contoh: nama@email.com"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  required
                />
                <p className="text-xs text-stone-400 mt-1">
                  Konfirmasi rincian pesanan dan notifikasi selesai akan dikirimkan ke email ini.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-4">Metode Pembayaran</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition border-orange-600 bg-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">Bayar Langsung ke Kasir</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-4 mb-6">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="border border-gray-100 rounded-xl p-4 bg-stone-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <span className="font-bold text-gray-900">
                      Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Tampilkan kustomisasi jika ada */}
                  {(item.noodleType || item.spiceLevel || item.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                      {item.noodleType && <p><span className="font-semibold">Mie:</span> {item.noodleType}</p>}
                      {item.spiceLevel && <p><span className="font-semibold">Pedas:</span> {item.spiceLevel}</p>}
                      {item.notes && <p><span className="font-semibold">Catatan:</span> {item.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between font-bold text-xl text-gray-900">
                <span>Total Belanja</span>
                <span className="text-orange-600">Rp{getTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || !isStoreOpen}
              className="w-full flex justify-center items-center gap-2 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Memproses...</>
              ) : !isStoreOpen ? (
                'Toko Sedang Tutup'
              ) : (
                'Buat Pesanan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
