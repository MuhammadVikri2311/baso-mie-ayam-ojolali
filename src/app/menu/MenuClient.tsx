'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Search } from 'lucide-react'

export function MenuClient({ products, categories }: { products: any[], categories: any[] }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 gap-2 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedCategory === 'ALL' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === c.id ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">Tidak ada menu yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
