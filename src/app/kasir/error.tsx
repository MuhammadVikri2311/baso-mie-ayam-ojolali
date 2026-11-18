'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react'

export default function KasirError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Kasir Error]:', error)
  }, [error])

  const isDbError =
    error.message?.toLowerCase().includes('database') ||
    error.message?.toLowerCase().includes('prisma') ||
    error.message?.toLowerCase().includes('reach database server') ||
    error.message?.toLowerCase().includes('connection')

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl shadow-stone-200/50 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-orange-100 text-orange-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-stone-900 mb-2">
          {isDbError ? 'Koneksi Database Terkendala' : 'Gagal Memuat Antrean Kasir'}
        </h2>

        <p className="text-stone-600 text-sm leading-relaxed mb-6">
          {isDbError
            ? 'Database sedang tidak dapat dihubungi. Silakan coba lagi.'
            : 'Terjadi kendala saat menyinkronkan data kasir. Silakan coba muat ulang.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <Link
            href="/kasir"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            Dashboard Kasir
          </Link>
        </div>
      </div>
    </div>
  )
}
