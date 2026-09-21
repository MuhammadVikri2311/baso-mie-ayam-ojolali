'use client'

import { useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { createOrder } from './actions'
import { ArrowLeft, Loader2, Store } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  
  const [mounted, setMounted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not authenticated or no items
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout')
    }
    if (mounted && items.length === 0 && !loading) {
      router.push('/keranjang')
    }
  }, [status, items.length, mounted, router, loading])

  if (!mounted || status === 'loading' || items.length === 0) return null

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    const result = await createOrder({
      items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      paymentMethod
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.success) {
      clearCart()
      router.push(`/pesanan/${result.orderId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/keranjang" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-4">Informasi Pelanggan</h2>
            <div className="space-y-2 text-gray-600">
              <p><span className="font-medium">Nama:</span> {session?.user?.name}</p>
              <p><span className="font-medium">Email:</span> {session?.user?.email}</p>
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
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <span className="font-medium text-gray-900">
                    Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
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
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Memproses...</>
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
