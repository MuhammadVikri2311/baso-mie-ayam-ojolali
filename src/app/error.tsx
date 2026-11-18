'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Tetap mencatat error asli ke console log server / client tanpa menyembunyikan
    console.error('[Application Error]:', error)
  }, [error])

  const isDbError =
    error.message?.toLowerCase().includes('database') ||
    error.message?.toLowerCase().includes('prisma') ||
    error.message?.toLowerCase().includes('reach database server') ||
    error.message?.toLowerCase().includes('connection')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-stone-200 shadow-xl shadow-stone-200/50 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-orange-100 text-orange-600 mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          {isDbError ? 'Koneksi Database Terputus' : 'Terjadi Kesalahan Sistem'}
        </h2>

        <p className="text-stone-600 text-sm leading-relaxed mb-8">
          {isDbError
            ? 'Database sedang tidak dapat dihubungi. Silakan coba lagi beberapa saat.'
            : 'Sistem mengalami kendala sementara saat memuat data. Silakan coba muat ulang.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm transition-all shadow-md shadow-orange-600/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}

