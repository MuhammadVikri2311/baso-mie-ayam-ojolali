'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { LayoutDashboard, Loader2 } from 'lucide-react'
import { loginAction } from '@/lib/authActions'

function KasirLoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'ADMIN') {
        router.push('/admin')
      } else if (session.user.role === 'KASIR') {
        router.push('/kasir')
      }
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const res = await loginAction({
      email,
      password,
      expectedPortal: 'kasir',
    })

    if (!res.success) {
      setError(res.error || 'Email atau password salah, atau akun tidak memiliki hak akses kasir.')
      setLoading(false)
    } else {
      window.location.href = res.redirectTo || '/kasir'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Kasir</label>
        <input 
          type="email" 
          name="email" 
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          placeholder="kasir@ojolali.com"
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
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : 'Masuk Dashboard'}
      </button>
    </form>
  )
}

export default function KasirLoginPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-8 flex justify-center">
        <h1 className="text-3xl font-bold text-orange-600 tracking-tight">Ojolali Kasir</h1>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full">
            <LayoutDashboard className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Portal Staff</h2>
        <p className="text-center text-gray-500 mb-8">Silakan masuk untuk mengelola pesanan pelanggan</p>

        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>}>
          <KasirLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
