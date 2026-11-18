'use client'

import { useState, useTransition } from 'react'
import {
  Store,
  Bell,
  Mail,
  Bot,
  Database,
  ShieldCheck,
  Save,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Radio,
  Sliders,
  Sparkles,
  Server,
  Lock,
  Cpu,
  Layers,
  HelpCircle,
  Power
} from 'lucide-react'
import {
  SystemConfigData,
  SystemHealthData,
  updateStoreInfo,
  updateNotificationConfig,
  updateEmailConfig,
  updateAiConfig,
  checkSystemHealth,
  testDatabaseConnection,
  testEmailConnection
} from './actions'
import { soundPlayer } from '@/lib/soundPlayer'

interface Props {
  initialConfig: SystemConfigData
  initialHealth: SystemHealthData
}

type TabKey = 'store' | 'notification' | 'email' | 'ai' | 'system' | 'security'

export default function KonfigurasiClient({ initialConfig, initialHealth }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('store')
  const [config, setConfig] = useState<SystemConfigData>(initialConfig)
  const [health, setHealth] = useState<SystemHealthData>(initialHealth)

  // Form states - Store Info
  const [storeName, setStoreName] = useState(config.storeName)
  const [storeDescription, setStoreDescription] = useState(config.storeDescription || '')
  const [storePhone, setStorePhone] = useState(config.storePhone)
  const [storeEmail, setStoreEmail] = useState(config.storeEmail || '')
  const [storeAddress, setStoreAddress] = useState(config.storeAddress)
  const [openingHours, setOpeningHours] = useState(config.openingHours)
  const [isOpen, setIsOpen] = useState(config.isOpen)

  // Form states - Notifications
  const [notificationEnabled, setNotificationEnabled] = useState(config.notificationEnabled)
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled)
  const [soundVolume, setSoundVolume] = useState(config.soundVolume)
  const [isPlayingSound, setIsPlayingSound] = useState(false)

  // Form states - Email
  const [emailOrderNotification, setEmailOrderNotification] = useState(config.emailOrderNotification)
  const [emailPaymentNotification, setEmailPaymentNotification] = useState(config.emailPaymentNotification)
  const [emailCompletionNotification, setEmailCompletionNotification] = useState(config.emailCompletionNotification)

  // Form states - AI
  const [aiEnabled, setAiEnabled] = useState(config.aiEnabled)
  const [aiRoleAdminEnabled, setAiRoleAdminEnabled] = useState(config.aiRoleAdminEnabled)
  const [aiRoleKasirEnabled, setAiRoleKasirEnabled] = useState(config.aiRoleKasirEnabled)
  const [aiRoleCustomerEnabled, setAiRoleCustomerEnabled] = useState(config.aiRoleCustomerEnabled)

  // Feedback states
  const [isPending, startTransition] = useTransition()
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Testing states
  const [isTestingDb, setIsTestingDb] = useState(false)
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean
    message: string
    latencyMs?: number
    provider?: string
    checkedAt?: string
    error?: string
  } | null>(null)

  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean
    message: string
    provider?: string
    isSandbox?: boolean
    allowedRecipient?: string
    checkedAt?: string
    error?: string
  } | null>(null)

  // Helper untuk menampilkan notifikasi toast sementara
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current))
    }, 4000)
  }

  // Handler: Simpan Informasi Toko
  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateStoreInfo({
        storeName,
        storeDescription,
        storePhone,
        storeEmail,
        storeAddress,
        openingHours,
        isOpen,
      })

      if (res.success && res.updatedAt) {
        setConfig((prev) => ({
          ...prev,
          storeName,
          storeDescription,
          storePhone,
          storeEmail,
          storeAddress,
          openingHours,
          isOpen,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy || prev.updatedBy,
        }))
        showFeedback('success', res.message || 'Informasi toko berhasil disimpan!')
      } else {
        showFeedback('error', res.error || 'Gagal menyimpan informasi toko.')
      }
    })
  }

  // Handler: Simpan Pengaturan Notifikasi
  const handleSaveNotification = () => {
    startTransition(async () => {
      const res = await updateNotificationConfig({
        notificationEnabled,
        soundEnabled,
        soundVolume,
      })

      if (res.success && res.updatedAt) {
        setConfig((prev) => ({
          ...prev,
          notificationEnabled,
          soundEnabled,
          soundVolume,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy || prev.updatedBy,
        }))
        // Sinkronisasi volume ke soundPlayer
        soundPlayer.setVolume(soundVolume / 100)
        showFeedback('success', res.message || 'Pengaturan notifikasi berhasil diperbarui!')
      } else {
        showFeedback('error', res.error || 'Gagal memperbarui notifikasi.')
      }
    })
  }

  // Handler: Tes Suara Notifikasi
  const handleTestSound = async () => {
    if (isPlayingSound) return
    setIsPlayingSound(true)
    try {
      soundPlayer.setVolume(soundVolume / 100)
      await soundPlayer.playTestSound()
      showFeedback('success', 'Suara notifikasi diputar penuh sampai selesai.')
    } catch (err) {
      console.error('Audio test error:', err)
      showFeedback('error', 'Gagal memutar audio notifikasi.')
    } finally {
      setIsPlayingSound(false)
    }
  }

  // Handler: Simpan Pengaturan Email
  const handleSaveEmail = () => {
    startTransition(async () => {
      const res = await updateEmailConfig({
        emailOrderNotification,
        emailPaymentNotification,
        emailCompletionNotification,
      })

      if (res.success && res.updatedAt) {
        setConfig((prev) => ({
          ...prev,
          emailOrderNotification,
          emailPaymentNotification,
          emailCompletionNotification,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy || prev.updatedBy,
        }))
        showFeedback('success', res.message || 'Pengaturan pemicu email berhasil disimpan!')
      } else {
        showFeedback('error', res.error || 'Gagal memperbarui pengaturan email.')
      }
    })
  }

  // Handler: Simpan Pengaturan AI
  const handleSaveAi = () => {
    startTransition(async () => {
      const res = await updateAiConfig({
        aiEnabled,
        aiRoleAdminEnabled,
        aiRoleKasirEnabled,
        aiRoleCustomerEnabled,
      })

      if (res.success && res.updatedAt) {
        setConfig((prev) => ({
          ...prev,
          aiEnabled,
          aiRoleAdminEnabled,
          aiRoleKasirEnabled,
          aiRoleCustomerEnabled,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy || prev.updatedBy,
        }))
        showFeedback('success', res.message || 'Pengaturan Ojolali AI berhasil diperbarui!')
      } else {
        showFeedback('error', res.error || 'Gagal memperbarui AI.')
      }
    })
  }

  // Handler: Refresh Status Sistem & Database
  const handleRefreshHealth = async () => {
    setIsRefreshingHealth(true)
    try {
      const res = await checkSystemHealth()
      if (res.success && res.health) {
        setHealth(res.health)
        showFeedback('success', 'Status database & sistem berhasil diperbarui!')
      } else {
        showFeedback('error', res.error || 'Gagal memeriksa kesehatan sistem.')
      }
    } catch {
      showFeedback('error', 'Koneksi gagal saat mengecek status.')
    } finally {
      setIsRefreshingHealth(false)
    }
  }

  // Handler: Test Koneksi Database Nyata
  const handleTestDatabase = async () => {
    setIsTestingDb(true)
    try {
      const res = await testDatabaseConnection()
      setDbTestResult(res)
      if (res.success) {
        showFeedback('success', `✓ ${res.message} (${res.latencyMs} ms)`)
        if (res.latencyMs !== undefined) {
          setHealth((prev) => ({
            ...prev,
            database: {
              ...prev.database,
              status: 'connected',
              latencyMs: res.latencyMs || prev.database.latencyMs,
              checkedAt: res.checkedAt || prev.database.checkedAt,
            },
          }))
        }
      } else {
        showFeedback('error', `✗ ${res.message}`)
      }
    } catch {
      setDbTestResult({
        success: false,
        message: 'Koneksi database terputus atau tidak merespons.',
      })
      showFeedback('error', 'Gagal menghubungi database.')
    } finally {
      setIsTestingDb(false)
    }
  }

  // Handler: Test Koneksi Email Nyata
  const handleTestEmail = async () => {
    setIsTestingEmail(true)
    try {
      const res = await testEmailConnection()
      setEmailTestResult(res)
      if (res.success) {
        showFeedback('success', `✓ ${res.message}`)
      } else {
        showFeedback('error', `✗ ${res.message}`)
      }
    } catch {
      setEmailTestResult({
        success: false,
        message: 'Gagal menguji provider email.',
        provider: 'Error',
        checkedAt: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      })
      showFeedback('error', 'Gagal memverifikasi layanan email.')
    } finally {
      setIsTestingEmail(false)
    }
  }

  // Format tanggal & waktu lokal
  const formatDateTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate)
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d)
    } catch {
      return isoDate
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-75"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Only
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600">
              Konfigurasi Terpusat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            Konfigurasi Sistem
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Kelola pengaturan utama dan konfigurasi operasional UMKM Ojolali.
          </p>
        </div>

        {/* Info Terakhir Diperbarui */}
        <div className="flex flex-col sm:items-end justify-center bg-stone-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-stone-200">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Terakhir diperbarui:</span>
          </div>
          <span className="text-xs font-bold text-stone-800 mt-0.5">
            {formatDateTime(config.updatedAt)} WIB
          </span>
          {config.updatedBy && (
            <span className="text-[11px] text-stone-400">oleh {config.updatedBy}</span>
          )}
        </div>
      </div>

      {/* Navigasi Tab Modern */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-stone-100/80 rounded-2xl border border-stone-200/80">
        {[
          { key: 'store', label: 'Informasi Toko', icon: Store },
          { key: 'notification', label: 'Notifikasi & Suara', icon: Bell },
          { key: 'email', label: 'Konfigurasi Email', icon: Mail },
          { key: 'ai', label: 'Ojolali AI', icon: Bot },
          { key: 'system', label: 'Sistem & Database', icon: Database },
          { key: 'security', label: 'Keamanan & RBAC', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-orange-600 shadow-xs border border-orange-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ============================================================== */}
      {/* SECTION A: INFORMASI TOKO */}
      {/* ============================================================== */}
      {activeTab === 'store' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    Konfigurasi Informasi Toko
                  </h2>
                  <p className="text-xs text-stone-500">
                    Atur profil bisnis, kontak resmi, alamat, jam operasional, dan status buka toko
                  </p>
                </div>
              </div>

              {/* Status Badge Ringkas */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  isOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span>{isOpen ? 'Toko Buka' : 'Toko Tutup'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveStoreInfo} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nama Toko */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Nama Toko / Usaha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Baso & Mie Ayam Ojolali"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                {/* Nomor WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp / Kontak <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="081316520717"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Digunakan untuk notifikasi WhatsApp pelanggan & kasir
                  </p>
                </div>

                {/* Email Toko */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Resmi Toko
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      placeholder="vikrim714@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                {/* Jam Operasional */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Jam Operasional <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      placeholder="Setiap Hari: 10.00 - 21.00 WIB"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi Toko */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Deskripsi Toko
                </label>
                <textarea
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Kuliner baso sapi asli dan mie ayam lezat khas Cirebon pilihan keluarga."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>

              {/* Alamat Toko */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap Toko <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    required
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Jl. Gn. Galunggung Permai, Perumnas, No. 25 RT. 07 RW. 16, Kota Cirebon, Jawa Barat"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Status Toko (Buka / Tutup) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Status Operasional Toko
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border font-bold text-sm transition cursor-pointer ${
                      isOpen
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-lg">🟢</span>
                    <div className="text-left">
                      <p className="leading-tight">Toko Buka</p>
                      <p className="text-[11px] font-normal text-emerald-600">
                        Menerima pesanan pelanggan
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border font-bold text-sm transition cursor-pointer ${
                      !isOpen
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs ring-1 ring-rose-300'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-lg">🔴</span>
                    <div className="text-left">
                      <p className="leading-tight">Toko Tutup</p>
                      <p className="text-[11px] font-normal text-rose-600">
                        Toko sedang tutup sementara
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-4 flex items-center justify-end border-t border-stone-100">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION B: KONFIGURASI NOTIFIKASI & SUARA */}
      {/* ============================================================== */}
      {activeTab === 'notification' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center gap-3 pb-5 border-b border-stone-100 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Konfigurasi Notifikasi & Audio
                </h2>
                <p className="text-xs text-stone-500">
                  Pengaturan suara pesanan baru, kontrol volume audio, dan pengujian durasi MP3
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Toggle 1: Notifikasi Pesanan Baru */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/70 border border-stone-200">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <p className="text-sm font-bold text-stone-800">
                      Aktifkan Notifikasi Pesanan Baru
                    </p>
                  </div>
                  <p className="text-xs text-stone-500">
                    Menampilkan banner notifikasi dan toast otomatis di dashboard Kasir & Admin saat ada pesanan baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notificationEnabled ? 'bg-orange-500' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notificationEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Suara Notifikasi */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/70 border border-stone-200">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-orange-500" />
                    <p className="text-sm font-bold text-stone-800">
                      Aktifkan Suara Notifikasi (Audio Chime)
                    </p>
                  </div>
                  <p className="text-xs text-stone-500">
                    Memutar file audio <code className="bg-stone-200/70 px-1 py-0.5 rounded text-[11px] text-orange-600">/sounds/notification.mp3</code> saat ada pesanan baru masuk secara real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    soundEnabled ? 'bg-orange-500' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Pengaturan Volume Suara */}
              <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-stone-400" />
                    ) : soundVolume < 50 ? (
                      <Volume1 className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="text-sm font-bold text-stone-800">
                      Volume Suara Notifikasi
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                    {soundVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-stone-400 font-semibold">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={soundVolume}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setSoundVolume(v)
                      soundPlayer.setVolume(v / 100)
                    }}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-xs text-stone-400 font-semibold">100%</span>
                </div>

                {/* Tombol Tes Suara */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200/60">
                  <div className="text-xs text-stone-500">
                    File sumber audio:{' '}
                    <span className="font-mono text-stone-700">/public/sounds/notification.mp3</span>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ✓ Audio dimainkan penuh sampai selesai sesuai durasi asli (~1.85 detik) tanpa terpotong
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSound}
                    disabled={isPlayingSound || !soundEnabled}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                      isPlayingSound
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 animate-pulse'
                        : !soundEnabled
                        ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                        : 'bg-white hover:bg-orange-50 text-orange-600 border border-orange-200'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isPlayingSound ? 'Sedang Memutar Suara...' : '🔊 Tes Suara (Full)'}</span>
                  </button>
                </div>
              </div>

              {/* Tombol Simpan Notifikasi */}
              <div className="pt-4 flex items-center justify-end border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleSaveNotification}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION C: KONFIGURASI EMAIL */}
      {/* ============================================================== */}
      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center gap-3 pb-5 border-b border-stone-100 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Konfigurasi Layanan Email
                </h2>
                <p className="text-xs text-stone-500">
                  Status provider email (Resend / Gmail SMTP) dan pengaturan pemicu notifikasi otomatis
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Status Provider Email */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1.5">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Status Layanan Email
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        health.email.isConfigured ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-sm font-bold text-stone-900">
                      {health.email.isConfigured ? '🟢 Terkonfigurasi' : '🔴 Belum Dikonfigurasi'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">Provider: {health.email.activeProvider}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1.5">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Pengirim Email (Sender)
                  </p>
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {health.email.senderEmail}
                  </p>
                  <p className="text-xs text-stone-500">Alamat email pengirim transaksi</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1.5">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Status Pengiriman Terakhir
                  </p>
                  <p className="text-xs font-semibold text-stone-800 line-clamp-2">
                    {health.email.statusMessage}
                  </p>
                </div>
              </div>

              {/* Security info note */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Keamanan Kredensial:</strong> Password email dan API Key tersimpan secara aman di Environment Variables server (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env</code>) dan tidak akan pernah ditampilkan secara langsung ke publik demi melindungi privasi.
                </p>
              </div>

              {/* Pemicu Notifikasi Email */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Pemicu Notifikasi Email Otomatis
                </h3>

                {/* Event 1: Pesanan Baru */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50/80 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-stone-800">
                      Kirim email saat pesanan baru dibuat
                    </p>
                    <p className="text-xs text-stone-500">
                      Mengirimkan struk ringkasan rincian pesanan dan total pembayaran ke email pelanggan.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailOrderNotification}
                    onChange={(e) => setEmailOrderNotification(e.target.checked)}
                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </label>

                {/* Event 2: Pembayaran Dikonfirmasi */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50/80 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-stone-800">
                      Kirim email saat pembayaran dikonfirmasi
                    </p>
                    <p className="text-xs text-stone-500">
                      Notifikasi konfirmasi tanda terima pembayaran lunas (QRIS/Transfer/Cash).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPaymentNotification}
                    onChange={(e) => setEmailPaymentNotification(e.target.checked)}
                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </label>

                {/* Event 3: Pesanan Selesai */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50/80 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-stone-800">
                      Kirim email saat pesanan selesai
                    </p>
                    <p className="text-xs text-stone-500">
                      Mengirimkan ucapan terima kasih dan konfirmasi penyelesaian hidangan ke pelanggan.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailCompletionNotification}
                    onChange={(e) => setEmailCompletionNotification(e.target.checked)}
                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Pengujian Koneksi Email Nyata */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">Uji Validasi Koneksi Email</h4>
                    <p className="text-xs text-stone-500">
                      Periksa apakah provider email (Resend API / Gmail SMTP) siap mengirimkan pesan secara nyata.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs border border-stone-300 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Radio className={`w-3.5 h-3.5 text-orange-600 ${isTestingEmail ? 'animate-pulse' : ''}`} />
                    <span>{isTestingEmail ? 'Memverifikasi Provider...' : 'Test Koneksi Email'}</span>
                  </button>
                </div>

                {emailTestResult && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                      emailTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {emailTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        {emailTestResult.success
                          ? '✓ Provider Email Berhasil Dikonfigurasi'
                          : '✗ Verifikasi Provider Gagal'}
                      </span>
                    </div>
                    <p className="pl-6">{emailTestResult.message}</p>
                    {emailTestResult.isSandbox && (
                      <p className="pl-6 text-[11px] text-amber-700 font-medium">
                        Mode Sandbox aktif: Pengiriman dibatasi hanya ke {emailTestResult.allowedRecipient}.
                      </p>
                    )}
                    {emailTestResult.checkedAt && (
                      <p className="pl-6 text-[10px] text-stone-400">
                        Diverifikasi pada: {emailTestResult.checkedAt}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tombol Simpan Email */}
              <div className="pt-4 flex items-center justify-end border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION D: KONFIGURASI CHATBOT AI */}
      {/* ============================================================== */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    Pengaturan Ojolali AI
                  </h2>
                  <p className="text-xs text-stone-500">
                    Manajemen status chatbot AI, hak akses berbasis role (RBAC), dan integritas data real-time
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  aiEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                  }`}
                />
                <span>{aiEnabled ? 'AI Aktif' : 'AI Nonaktif'}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Master AI Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/70 border border-stone-200">
                <div className="space-y-0.5 pr-4">
                  <p className="text-sm font-bold text-stone-800">
                    Status Ojolali AI Assistant
                  </p>
                  <p className="text-xs text-stone-500">
                    Mengaktifkan floating assistant AI di seluruh dashboard & portal pelanggan dengan query real-time PostgreSQL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    aiEnabled ? 'bg-orange-500' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      aiEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Arsitektur Akses Berbasis Role (Role-based Access) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Role-Based Access Control (RBAC) Chatbot AI
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Prisma Live Query
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Admin AI */}
                  <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        👑 Admin AI
                      </span>
                      <input
                        type="checkbox"
                        checked={aiRoleAdminEnabled}
                        onChange={(e) => setAiRoleAdminEnabled(e.target.checked)}
                        className="w-4 h-4 text-orange-600 accent-orange-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-stone-600">
                      Membaca seluruh data manajemen:
                    </p>
                    <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
                      <li>Dashboard & Rekap Penjualan</li>
                      <li>Semua Pesanan & Riwayat Transaksi</li>
                      <li>Statistik Pelanggan & Omzet Total</li>
                      <li>Kategori & Menu Makanan</li>
                    </ul>
                  </div>

                  {/* Kasir AI */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        💼 Kasir AI
                      </span>
                      <input
                        type="checkbox"
                        checked={aiRoleKasirEnabled}
                        onChange={(e) => setAiRoleKasirEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-stone-600">
                      Akses operasional kasir:
                    </p>
                    <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
                      <li>Pesanan Menunggu & Aktif</li>
                      <li>Transaksi Selesai & Lunas</li>
                      <li>Riwayat Transaksi Kasir & Omzet Riwayat</li>
                      <li>Konsisten dengan halaman kasir</li>
                    </ul>
                  </div>

                  {/* Pelanggan AI */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        👤 Pelanggan AI
                      </span>
                      <input
                        type="checkbox"
                        checked={aiRoleCustomerEnabled}
                        onChange={(e) => setAiRoleCustomerEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-stone-600">
                      Bantuan pemesanan ramah:
                    </p>
                    <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside">
                      <li>Informasi Menu & Rekomendasi</li>
                      <li>Pilihan Level Pedas & Varian Mie</li>
                      <li>Status Pesanan miliknya sendiri</li>
                      <li>Tidak melihat data pelanggan lain</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Komitmen Integritas Data */}
              <div className="p-4 rounded-xl bg-stone-50/90 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Prinsip Integritas Data Aktual</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Chatbot Ojolali AI tidak lagi menggunakan template teks dummy atau jawaban hardcode. Setiap pertanyaan diautentikasi sesuai role pengguna dan dieksekusi melalui query Prisma ORM langsung ke Neon PostgreSQL untuk menjamin angka omzet dan total transaksi selalu 100% sinkron dengan halaman operasional.
                </p>
              </div>

              {/* Tombol Simpan AI */}
              <div className="pt-4 flex items-center justify-end border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleSaveAi}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION E: KONFIGURASI SISTEM & DATABASE */}
      {/* ============================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center justify-between pb-5 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    Informasi Sistem & Status Database
                  </h2>
                  <p className="text-xs text-stone-500">
                    Pengecekan koneksi database, latensi serverless, dan environment runtime aplikasi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={isTestingDb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Database className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-pulse' : ''}`} />
                  <span>{isTestingDb ? 'Menguji Database...' : 'Test Koneksi Database'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshHealth}
                  disabled={isRefreshingHealth}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-orange-600 border border-stone-200 hover:border-orange-200 text-xs font-bold transition cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshingHealth ? 'animate-spin text-orange-600' : ''}`} />
                  <span>{isRefreshingHealth ? 'Memeriksa...' : 'Refresh Status'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Status Database Box */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  health.database.status === 'connected'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          health.database.status === 'connected'
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />
                      <h3 className="text-base font-extrabold text-stone-900">
                        {health.database.status === 'connected'
                          ? '🟢 Database Connected'
                          : '🔴 Database Disconnected'}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-600">
                      Provider: <span className="font-semibold">{health.database.provider}</span>
                    </p>
                  </div>

                  {health.database.status === 'connected' && (
                    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-bold text-stone-700">
                        Latensi:{' '}
                        <span className="text-emerald-600">{health.database.latencyMs} ms</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hasil Uji Koneksi Database Nyata */}
              {dbTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all animate-in fade-in ${
                    dbTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {dbTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {dbTestResult.success
                        ? '✓ Database Berhasil Terhubung'
                        : '✗ Database Tidak Dapat Dihubungi'}
                    </span>
                  </div>
                  <p className="pl-6">{dbTestResult.message}</p>
                  {dbTestResult.latencyMs !== undefined && (
                    <p className="pl-6 text-[11px] text-stone-600 font-medium">
                      Latensi Eksekusi:{' '}
                      <span className="font-bold text-emerald-700">
                        {dbTestResult.latencyMs} ms
                      </span>{' '}
                      • Provider: {dbTestResult.provider}
                      {dbTestResult.checkedAt ? ` • Waktu Cek: ${dbTestResult.checkedAt}` : ''}
                    </p>
                  )}
                  {dbTestResult.error && (
                    <p className="pl-6 text-[11px] text-rose-600 font-mono">
                      Detail Error: {dbTestResult.error}
                    </p>
                  )}
                </div>
              )}

              {/* Grid Spesifikasi Sistem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Environment
                  </p>
                  <p className="text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-orange-500" />
                    <span>{health.environment}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Web Framework
                  </p>
                  <p className="text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>{health.app.framework}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Database ORM
                  </p>
                  <p className="text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span>{health.app.orm}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-1">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Node.js Runtime
                  </p>
                  <p className="text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-500" />
                    <span>{health.app.nodeVersion}</span>
                  </p>
                </div>
              </div>

              {/* Proteksi Kredensial Database */}
              <div className="p-4 rounded-xl bg-stone-50/90 border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-800">Perlindungan Kredensial Database Terjamin</p>
                  <p className="text-stone-500 mt-0.5">
                    String koneksi (<code className="font-mono bg-stone-200/80 px-1 py-0.5 rounded text-[11px]">DATABASE_URL</code>), password host, dan kredensial autentikasi terisolasi di sisi server dan tidak diekspos ke antarmuka demi keamanan infrastruktur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION F: KONFIGURASI KEAMANAN & RBAC */}
      {/* ============================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-7">
            <div className="flex items-center gap-3 pb-5 border-b border-stone-100 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Konfigurasi Keamanan & Hak Akses
                </h2>
                <p className="text-xs text-stone-500">
                  Status Role-Based Access Control, proteksi rute Administrator, dan isolasi sesi pengguna
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Info Sesi Aktif */}
              <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Sesi Administrator Aktif
                  </p>
                  <p className="text-sm font-extrabold text-stone-900">
                    {health.auth.currentUser.name} ({health.auth.currentUser.email})
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✓ Terverifikasi sebagai role {health.auth.currentUser.role}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-orange-100 text-orange-800 text-xs font-bold flex items-center gap-1.5 w-fit">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Session Authenticated</span>
                </div>
              </div>

              {/* Status RBAC Checks */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Matriks Hak Akses Terdaftar
                </h3>

                <div className="p-4 rounded-xl border border-stone-200 divide-y divide-stone-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-800">Role Management System</p>
                      <p className="text-stone-500">
                        Membedakan hak akses secara ketat antara ADMIN, KASIR, dan PELANGGAN.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Aktif
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-800">Proteksi Halaman Konfigurasi</p>
                      <p className="text-stone-500">
                        Hanya akun dengan role ADMIN yang dapat membuka rute <code className="bg-stone-100 px-1 py-0.5 rounded text-orange-600">/admin/konfigurasi</code>.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Enforced (Strict)
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-800">Isolasi Cookie Multi-Portal</p>
                      <p className="text-stone-500">
                        Cookie sesi Admin terpisah dari cookie Kasir dan Pelanggan untuk mencegah bentrok sesi.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Terisolasi
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-800">Enkripsi Kata Sandi</p>
                      <p className="text-stone-500">
                        Password akun di-hash menggunakan algoritma Bcrypt dengan salt rounds standar industri.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Bcrypt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

