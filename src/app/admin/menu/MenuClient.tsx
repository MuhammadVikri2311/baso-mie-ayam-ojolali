'use client'

import { useState } from 'react'
import { addProduct, deleteProduct, toggleProductAvailability } from './actions'
import { Loader2, Plus, Trash2, Edit2, X } from 'lucide-react'

export default function MenuClient({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: categories[0]?.id || '',
    description: ''
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('add')
    const res = await addProduct({
      name: formData.name,
      price: Number(formData.price),
      categoryId: formData.categoryId,
      description: formData.description
    })
    
    if (res.success) {
      setShowForm(false)
      setFormData({ name: '', price: '', categoryId: categories[0]?.id || '', description: '' })
    } else {
      alert(res.error)
    }
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus menu ini?')) {
      setLoading(id)
      const res = await deleteProduct(id)
      if (res.error) alert(res.error)
      setLoading(null)
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    setLoading(id)
    const res = await toggleProductAvailability(id, !current)
    if (res.error) alert(res.error)
    setLoading(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Menu</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Batal' : 'Tambah Menu'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
          <h2 className="font-bold text-lg mb-4">Tambah Menu Baru</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Menu</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none">
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
            </div>
            <button disabled={loading === 'add'} type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50">
              {loading === 'add' ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}
      
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 font-semibold text-gray-600">Nama</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Kategori</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Harga</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Status</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-4 text-gray-900 font-medium">{p.name}</td>
                <td className="py-3 px-4 text-gray-600">{p.category.name}</td>
                <td className="py-3 px-4 text-gray-900">Rp{p.price.toLocaleString('id-ID')}</td>
                <td className="py-3 px-4">
                  <button 
                    onClick={() => handleToggle(p.id, p.isAvailable)}
                    disabled={loading === p.id}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition disabled:opacity-50 ${p.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {p.isAvailable ? 'Tersedia' : 'Habis'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button onClick={() => handleDelete(p.id)} disabled={loading === p.id} className="text-red-600 hover:text-red-800 transition disabled:opacity-50">
                    <Trash2 className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {initialProducts.length === 0 && (
          <p className="text-center text-gray-500 py-8">Belum ada menu.</p>
        )}
      </div>
    </div>
  )
}
