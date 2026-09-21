'use client'

import { useCartStore } from '@/lib/store'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function KeranjangPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <Trash2 className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 mb-8">Anda belum menambahkan menu apapun ke keranjang.</p>
        <Link href="/menu" className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition">
          Lihat Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs font-medium">No Image</span>
                )}
              </div>
              <div className="flex flex-col justify-between flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-orange-600">Rp{item.price.toLocaleString('id-ID')}</span>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Ringkasan Belanja</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Total Harga</span>
                <span>Rp{getTotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span className="text-orange-600">Rp{getTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>
            <Link 
              href="/checkout"
              className="w-full flex justify-center items-center gap-2 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition"
            >
              Checkout <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
