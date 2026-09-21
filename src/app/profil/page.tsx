'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { updateProfile } from './actions'
import { User, Mail, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const router = useRouter()

  if (!session?.user) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' })
      await update({ name: formData.get('name') })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil Saya</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-4xl">
            {session.user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session.user.name}</h2>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Mail className="w-4 h-4" /> {session.user.email}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {session.user.role}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : null}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                defaultValue={session.user.name || ''}
                required
                className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Anda hanya dapat mengubah nama lengkap.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Tidak dapat diubah)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                disabled
                defaultValue={session.user.email || ''}
                className="pl-10 w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  )
}
