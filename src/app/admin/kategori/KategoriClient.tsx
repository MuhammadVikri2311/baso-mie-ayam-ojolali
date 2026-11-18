'use client'

import { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Package, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Calendar,
  Sparkles,
  ArrowUpDown
} from 'lucide-react'
import { createCategory, updateCategory, deleteCategory } from './actions'

export interface CategoryWithCount {
  id: string
  name: string
  description: string | null
  createdAt: Date | string
  updatedAt: Date | string
  _count: {
    products: number
  }
}

interface Props {
  initialCategories: CategoryWithCount[]
}

export default function KategoriClient({ initialCategories }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)
  
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return initialCategories
    const q = searchQuery.toLowerCase().trim()
    return initialCategories.filter(
      c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    )
  }, [initialCategories, searchQuery])

  // Summary statistics
  const totalCategories = initialCategories.length
  const totalProducts = initialCategories.reduce((acc, c) => acc + (c._count?.products || 0), 0)
  const mostPopulated = [...initialCategories].sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0))[0]

  const openCreateModal = () => {
    setFormData({ name: '', description: '' })
    setSelectedCategory(null)
    setModalMode('create')
    setStatusMessage(null)
  }

  const openEditModal = (cat: CategoryWithCount) => {
    setFormData({ name: cat.name, description: cat.description || '' })
    setSelectedCategory(cat)
    setModalMode('edit')
    setStatusMessage(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedCategory(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatusMessage(null)

    try {
      if (modalMode === 'create') {
        const res = await createCategory(formData)
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error })
        } else {
          setStatusMessage({ type: 'success', text: `Kategori "${formData.name}" berhasil dibuat!` })
          closeModal()
        }
      } else if (modalMode === 'edit' && selectedCategory) {
        const res = await updateCategory(selectedCategory.id, formData)
        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error })
        } else {
          setStatusMessage({ type: 'success', text: `Kategori "${formData.name}" berhasil diperbarui!` })
          closeModal()
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    setStatusMessage(null)

    try {
      const res = await deleteCategory(deleteTarget.id)
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error })
      } else {
        setStatusMessage({ type: 'success', text: `Kategori "${deleteTarget.name}" berhasil dihapus!` })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kategori.'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
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
              Master Data
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">Katalog Menu UMKM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Manajemen Kategori
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Atur pengelompokan menu Baso & Mie Ayam Ojolali untuk mempermudah pemesanan pelanggan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-200 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
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
            <p className="text-xs font-bold text-orange-700 tracking-wide uppercase">Total Kategori</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">{totalCategories}</p>
            <p className="text-xs text-stone-500 mt-0.5">Kategori aktif di sistem</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-yellow-50/30 border border-amber-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">Menu Terdaftar</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">{totalProducts}</p>
            <p className="text-xs text-stone-500 mt-0.5">Produk terkait kategori</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-50 to-orange-50/20 border border-stone-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600 tracking-wide uppercase">Kategori Terbesar</p>
            <p className="text-lg font-bold text-stone-900 mt-1 truncate max-w-[150px]">
              {mostPopulated ? mostPopulated.name : '-'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {mostPopulated ? `${mostPopulated._count?.products || 0} menu produk` : 'Belum ada produk'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-200/60 text-stone-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori atau deskripsi..."
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

        <div className="text-xs font-semibold text-stone-500 self-center">
          Menampilkan <span className="text-stone-900 font-bold">{filteredCategories.length}</span> dari {totalCategories} kategori
        </div>
      </div>

      {/* Category Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Nama Kategori</th>
                <th className="py-3.5 px-4">Deskripsi</th>
                <th className="py-3.5 px-4 text-center">Jumlah Produk</th>
                <th className="py-3.5 px-4">Dibuat Pada</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredCategories.map((category, index) => {
                const productCount = category._count?.products || 0
                return (
                  <tr 
                    key={category.id} 
                    className="hover:bg-orange-50/40 transition-colors group"
                  >
                    <td className="py-4 px-4 text-center text-xs font-bold text-stone-400">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100/70 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{category.name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">ID: {category.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-600 max-w-xs">
                      {category.description ? (
                        <span className="line-clamp-2">{category.description}</span>
                      ) : (
                        <span className="text-stone-400 italic text-xs">Tidak ada deskripsi</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        productCount > 0
                          ? 'bg-amber-100/70 text-amber-800 border border-amber-200/60'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        <Package className="w-3 h-3" />
                        {productCount} Menu
                      </span>
                    </td>
                    <td className="py-4 px-4 text-stone-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {new Date(category.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(category)}
                          title="Edit Kategori"
                          className="p-2 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          title="Hapus Kategori"
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
        {filteredCategories.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `Tidak ada kategori yang sesuai dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Mulai dengan menambahkan kategori menu seperti Bakso, Mie Ayam, atau Minuman.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori Sekarang
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {modalMode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {modalMode === 'create' ? 'Buat kategori menu baru untuk toko' : `Memperbarui kategori ${selectedCategory?.name}`}
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
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Bakso, Mie Ayam, Minuman..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Deskripsi <span className="text-stone-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan singkat mengenai kategori menu..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Menyimpan...' : 'Simpan Kategori'}</span>
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
              Hapus Kategori &ldquo;{deleteTarget.name}&rdquo;?
            </h3>

            {deleteTarget._count.products > 0 ? (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Kategori Sedang Digunakan!
                </p>
                <p>
                  Kategori ini memiliki <span className="font-bold">{deleteTarget._count.products} produk menu</span> yang masih terhubung.
                </p>
                <p className="text-amber-700 text-xs">
                  Sistem keamanan database mencegah penghapusan kategori yang masih digunakan produk agar katalog menu tidak rusak. Silakan ubah atau hapus produk terlebih dahulu.
                </p>
              </div>
            ) : (
              <p className="text-sm text-stone-500 mt-2">
                Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus secara permanen dari sistem database.
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleteTarget._count.products > 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
