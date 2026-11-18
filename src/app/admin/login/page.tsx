'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { loginAction } from '@/lib/authActions'

function AdminLoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      router.push('/admin')
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
      expectedPortal: 'admin',
    })

    if (!res.success) {
      setError(res.error || 'Email atau password salah.')
      setLoading(false)
    } else {
      window.location.href = res.redirectTo || '/admin'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Administrator</label>
        <input 
          type="email" 
          name="email" 
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          placeholder="admin@ojolali.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input 
          type="password" 
          name="password" 
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          placeholder="Masukkan password admin"
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
        className="w-full flex justify-center items-center gap-2 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:bg-gray-400 mt-4 cursor-pointer"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : 'Masuk Dashboard Admin'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-8 flex justify-center">
        <h1 className="text-3xl font-bold text-orange-600 tracking-tight">Ojolali Admin</h1>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full">
            <ShieldCheck className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Portal Administrator</h2>
        <p className="text-center text-gray-500 mb-8">Masuk untuk mengelola seluruh data dan sistem Ojolali</p>

        <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
