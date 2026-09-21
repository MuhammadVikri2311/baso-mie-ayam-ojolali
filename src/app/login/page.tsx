'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Utensils, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      setError('Email atau password salah')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Masukkan password"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:bg-gray-400 mt-4"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : 'Masuk'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full">
            <Utensils className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Masuk ke Akun</h1>
        <p className="text-center text-gray-500 mb-8">Silakan login untuk melanjutkan pesanan</p>

        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-600 mt-6">
          Belum punya akun?{' '}
          <Link href="/register" className="text-orange-600 font-bold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
