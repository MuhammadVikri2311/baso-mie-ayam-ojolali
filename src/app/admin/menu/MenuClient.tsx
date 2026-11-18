'use client'

import { useState, useMemo } from 'react'
import { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability 
} from './actions'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  Layers, 
  Check, 
  AlertCircle, 
  Loader2, 
  X,
  CheckCircle2,
  XCircle,
  UtensilsCrossed
} from 'lucide-react'

export interface AdminProduct {
  id: string
  categoryId: string
  category: {
    id: string
    name: string
  }
  name: string
  description: string | null
  price: number
  image: string | null
  isAvailable: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AdminCategory {
  id: string
  name: string
}

interface Props {
  initialProducts: AdminProduct[]
  categories: AdminCategory[]
}

export default function MenuClient({ initialProducts, categories }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: categories[0]?.id || '',
    description: '',
    isAvailable: true,
  })

  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))

      const matchCategory =
        selectedCategoryFilter === 'ALL' || product.categoryId === selectedCategoryFilter

      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'AVAILABLE' && product.isAvailable) ||
        (selectedStatusFilter === 'OUT_OF_STOCK' && !product.isAvailable)

      return matchSearch && matchCategory && matchStatus
    })
  }, [initialProducts, searchQuery, selectedCategoryFilter, selectedStatusFilter])

  // Statistics
  const totalMenu = initialProducts.length
  const totalAvailable = initialProducts.filter((p) => p.isAvailable).length
  const totalUnavailable = totalMenu - totalAvailable

  const openCreateModal = () => {
    setFormData({
      name: '',
      price: '',
      categoryId: categories[0]?.id || '',
      description: '',
      isAvailable: true,
    })
    setEditingProduct(null)
    setModalMode('create')
    setStatusMessage(null)
  }

  const openEditModal = (product: AdminProduct) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId,
      description: product.description || '',
      isAvailable: product.isAvailable,
    })
    setEditingProduct(product)
    setModalMode('edit')
    setStatusMessage(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingProduct(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction('form-submit')
    setStatusMessage(null)

    const numPrice = Number(formData.price)
    if (isNaN(numPrice) || numPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Harga harus berupa angka valid.' })
      setLoadingAction(null)
      return
    }

    try {
      if (modalMode === 'create') {
        const res = await addProduct({
          name: formData.name,
          price: numPrice,
          categoryId: formData.categoryId,
          description: formData.description,
        })
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error })
        } else {
          setStatusMessage({ type: 'success', text: `Menu "${formData.name}" berhasil ditambahkan!` })
          closeModal()
        }
      } else if (modalMode === 'edit' && editingProduct) {
        const res = await updateProduct(editingProduct.id, {
          name: formData.name,
          price: numPrice,
          categoryId: formData.categoryId,
          description: formData.description,
          isAvailable: formData.isAvailable,
        })
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error })
        } else {
          setStatusMessage({ type: 'success', text: `Menu "${formData.name}" berhasil diperbarui!` })
          closeModal()
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    setLoadingAction(`toggle-${id}`)
    try {
      const res = await toggleProductAvailability(id, !current)
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error })
      } else {
        setStatusMessage({
          type: 'success',
          text: `Status menu berhasil diubah menjadi ${!current ? 'Tersedia' : 'Habis'}.`,
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status.'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoadingAction(`delete-${deleteTarget.id}`)
    setStatusMessage(null)

    try {
      const res = await deleteProduct(deleteTarget.id)
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error })
      } else {
        setStatusMessage({ type: 'success', text: `Menu "${deleteTarget.name}" berhasil dihapus!` })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus menu.'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setLoadingAction(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              Katalog Toko
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Baso & Mie Ayam Ojolali</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Manajemen Menu
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Tambah menu baru, perbarui harga, serta atur ketersediaan stok produk secara praktis.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/30 border border-orange-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-orange-700 tracking-wide uppercase">Total Menu</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">{totalMenu}</p>
            <p className="text-xs text-stone-500 mt-0.5">Produk aktif dalam katalog</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Menu Tersedia</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1">{totalAvailable}</p>
            <p className="text-xs text-stone-500 mt-0.5">Dapat dipesan pelanggan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50/70 to-orange-50/20 border border-rose-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-700 tracking-wide uppercase">Menu Habis</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-950 mt-1">{totalUnavailable}</p>
            <p className="text-xs text-stone-500 mt-0.5">Stok sementara kosong</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu atau deskripsi..."
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
          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:bg-white focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="AVAILABLE">Tersedia</option>
            <option value="OUT_OF_STOCK">Habis</option>
          </select>
        </div>
      </div>

      {/* Menu Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Menu</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredProducts.map((product, index) => {
                const isToggling = loadingAction === `toggle-${product.id}`
                return (
                  <tr key={product.id} className="hover:bg-orange-50/40 transition-colors group">
                    <td className="py-4 px-4 text-center text-xs font-bold text-stone-400">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                          <UtensilsCrossed className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-stone-900 truncate">{product.name}</p>
                          <p className="text-xs text-stone-500 line-clamp-1">
                            {product.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        <Layers className="w-3 h-3 text-orange-500" />
                        {product.category?.name || 'Tanpa Kategori'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-stone-900">
                      Rp{product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggle(product.id, product.isAvailable)}
                        disabled={isToggling}
                        title="Klik untuk mengubah ketersediaan"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150 disabled:opacity-50 cursor-pointer ${
                          product.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : product.isAvailable ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{product.isAvailable ? 'Tersedia' : 'Habis'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(product)}
                          title="Edit Menu"
                          className="p-2 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="Hapus Menu"
                          className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {searchQuery || selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                ? 'Menu Tidak Ditemukan'
                : 'Belum Ada Menu'}
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                ? 'Tidak ada produk yang cocok dengan filter yang dipilih. Coba reset filter atau kata kunci pencarian.'
                : 'Mulai dengan menambahkan menu bakso, mie ayam, atau minuman segar untuk toko Anda.'}
            </p>
            {!searchQuery && selectedCategoryFilter === 'ALL' && selectedStatusFilter === 'ALL' && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tambah Menu Pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {modalMode === 'create' ? 'Tambah Menu Baru' : 'Edit Menu'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {modalMode === 'create'
                      ? 'Lengkapi rincian menu untuk ditampilkan di katalog'
                      : `Perbarui data menu ${editingProduct?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Bakso Urat Jumbo"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="18000"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Deskripsi Menu <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat rasa, porsi, atau toping..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition resize-none"
                />
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    id="isAvailableCheckbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded-sm border-stone-300 focus:ring-orange-500"
                  />
                  <label htmlFor="isAvailableCheckbox" className="text-xs font-bold text-stone-700 select-none">
                    Status Menu: {formData.isAvailable ? 'Tersedia untuk Dipesan' : 'Habis / Stok Kosong'}
                  </label>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loadingAction === 'form-submit'}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'form-submit'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {loadingAction === 'form-submit' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loadingAction === 'form-submit' ? 'Menyimpan...' : 'Simpan Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900">
              Hapus Menu &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-sm text-stone-500 mt-2">
              Menu ini akan dihapus dari katalog produk. Jika menu ini pernah dipesan, sistem akan memberi notifikasi untuk menjaga integritas riwayat pesanan pelanggan.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={loadingAction === `delete-${deleteTarget.id}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loadingAction === `delete-${deleteTarget.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {loadingAction === `delete-${deleteTarget.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {loadingAction === `delete-${deleteTarget.id}` ? 'Menghapus...' : 'Ya, Hapus Menu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
