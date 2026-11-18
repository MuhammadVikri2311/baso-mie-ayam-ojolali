import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { getSystemConfig } from './actions'
import KonfigurasiClient from './KonfigurasiClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Konfigurasi Sistem | Baso & Mie Ayam Ojolali Admin',
  description: 'Kelola pengaturan utama dan konfigurasi operasional UMKM Ojolali.',
}

export const dynamic = 'force-dynamic'

export default async function KonfigurasiPage() {
  // Verifikasi otentikasi role Administrator
  const session = await getAdminSession()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  // Muat data konfigurasi dan kesehatan sistem dari server
  const result = await getSystemConfig()

  if (!result.success || !result.config || !result.health) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-3">
        <h2 className="text-lg font-bold">Gagal Memuat Konfigurasi Sistem</h2>
        <p className="text-sm">{result.error || 'Terjadi gangguan saat mengambil data konfigurasi.'}</p>
      </div>
    )
  }

  return (
    <KonfigurasiClient
      initialConfig={result.config}
      initialHealth={result.health}
    />
  )
}

