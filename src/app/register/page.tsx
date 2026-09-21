'use client'

import { useState } from 'react'
import { registerUser } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Utensils } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await registerUser(formData)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/login?registered=true')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full">
            <Utensils className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Daftar Akun Baru</h1>
        <p className="text-center text-gray-500 mb-8">Selamat datang di UMKM Baso & Mie Ayam Ojolali</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              name="name" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="Masukkan nama Anda"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="contoh@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="Ulangi password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:bg-gray-400 mt-2"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-orange-600 font-bold hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
