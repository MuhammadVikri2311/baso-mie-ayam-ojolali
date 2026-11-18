'use client'

import { useCartStore } from '@/lib/store'
import { ShoppingCart, Utensils, X } from 'lucide-react'
import { useState } from 'react'

type MenuProduct = {
  id: string
  name: string
  price: number
  image: string | null
  description?: string | null
  isAvailable: boolean
  category: { name: string }
}

export function ProductCard({ product }: { product: MenuProduct }) {
  const addItem = useCartStore((state) => state.addItem)
  
  const [showModal, setShowModal] = useState(false)
  const [noodleType, setNoodleType] = useState('Mie Kuning')
  const [spiceLevel, setSpiceLevel] = useState('Tidak Pedas')
  const [notes, setNotes] = useState('')

  const categoryNameLower = (product.category?.name || '').toLowerCase().trim()
  const isBakso = categoryNameLower === 'bakso' || categoryNameLower === 'baso'
  const isDrink = categoryNameLower === 'minuman'
  const noodleOptions = ['Mie Kuning', 'Mie Bihun', 'Mie Kuning + Bihun']
  
  const showNoodleType = isBakso
  const showSpiceLevel = !isDrink
  const showNotes = !isDrink

  const handleAddToCart = () => {
    // If it requires customization, show modal first
    if (showNoodleType || showSpiceLevel || true) { // We always show modal to allow adding notes or confirming
      setShowModal(true)
    }
  }

  const handleConfirmAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      noodleType: showNoodleType ? noodleType : null,
      spiceLevel: showSpiceLevel ? spiceLevel : null,
      notes: showNotes && notes.trim() !== '' ? notes.trim() : null
    })
    setShowModal(false)
    // Reset state for next time
    setNoodleType('Mie Kuning')
    setSpiceLevel('Tidak Pedas')
    setNotes('')
  }

  return (
    <>
      <div className="group bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-stone-100 flex flex-col h-full overflow-hidden relative">
        <div className="aspect-video w-full bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl mb-5 flex flex-col items-center justify-center overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <>
              <Utensils className="w-10 h-10 text-orange-200 mb-2" />
              <span className="text-orange-300/80 font-bold tracking-wider text-sm uppercase">Ojolali</span>
            </>
          )}
        </div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-xs text-orange-500 font-medium mb-2 uppercase tracking-wider">{product.category.name}</p>
        <p className="text-stone-500 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">{product.description}</p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-stone-100">
          <span className="font-extrabold text-stone-900 text-lg">
            Rp{product.price.toLocaleString('id-ID')}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              product.isAvailable 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white hover:shadow-md' 
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            {product.isAvailable ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                Tambah
              </>
            ) : (
              'Habis'
            )}
          </button>
        </div>
      </div>

      {/* Modal Kustomisasi */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-lg text-gray-900">Kustomisasi Pesanan</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto flex-1 overscroll-contain">
              <div className="flex items-center gap-4 bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50">
                <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                   {product.image ? (
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <Utensils className="w-6 h-6 text-orange-200" />
                   )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{product.name}</h4>
                  <p className="text-orange-600 font-bold text-sm">Rp{product.price.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {showNoodleType && (
                <div>
                  <p className="block text-sm font-bold text-gray-700 mb-2">Pilihan Mie <span className="text-red-500">*</span></p>
                  <div className="space-y-2">
                    {noodleOptions.map((type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-3 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          noodleType === type
                            ? 'border-orange-600 bg-orange-50 text-orange-700 ring-1 ring-orange-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`noodleType-${product.id}`}
                          value={type}
                          checked={noodleType === type}
                          onChange={() => setNoodleType(type)}
                          className="accent-orange-600 w-4 h-4"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showSpiceLevel && (
                <div>
                  <p className="block text-sm font-bold text-gray-700 mb-2">Level Pedas <span className="text-red-500">*</span></p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Tidak Pedas', 'Sedang', 'Pedas'].map((level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setSpiceLevel(level)}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium text-center transition-all ${
                          spiceLevel === level
                            ? 'border-orange-600 bg-orange-50 text-orange-700 ring-1 ring-orange-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showNotes && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Tambahan</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: tidak pakai daun bawang, kuah dipisah..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none h-24 bg-gray-50/50 focus:bg-white transition-all"
                  />
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm shrink-0">
              <button
                onClick={handleConfirmAdd}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-600/20 active:scale-[0.99]"
              >
                <ShoppingCart className="w-5 h-5" />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
