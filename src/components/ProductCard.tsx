'use client'

import { CartItem, useCartStore } from '@/lib/store'
import { ShoppingCart, Utensils } from 'lucide-react'

export function ProductCard({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
    // In a real app we'd show a toast here
  }

  return (
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
  )
}
