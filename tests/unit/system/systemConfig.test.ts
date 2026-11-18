import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPublicStoreConfig, checkIsStoreOpen, DEFAULT_STORE_CONFIG } from '@/lib/systemConfig'
import { db } from '@/lib/db'
import type { SystemConfig } from '@prisma/client'

// Mock database Prisma agar test berjalan tanpa koneksi database Neon sungguhan
vi.mock('@/lib/db', () => ({
  db: {
    systemConfig: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Unit Test: System Configuration & Jam Operasional (Prisma Mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('harus mengembalikan konfigurasi dari database ketika record ditemukan', async () => {
    const mockDbConfig = {
      id: 'default',
      storeName: 'Baso Ojolali Cabang Cirebon',
      storeDescription: 'Cabang Baru Mantap',
      storePhone: '08999999999',
      storeEmail: 'cabang@ojolali.com',
      storeAddress: 'Jl. Pemuda No. 10',
      openingHours: '10.00 - 22.00 WIB',
      isOpen: true,
      notificationEnabled: true,
      soundEnabled: false,
      soundVolume: 50,
      emailOrderNotification: true,
      emailPaymentNotification: true,
      emailCompletionNotification: true,
      aiEnabled: true,
      aiRoleAdminEnabled: true,
      aiRoleKasirEnabled: true,
      aiRoleCustomerEnabled: true,
    }

    vi.mocked(db.systemConfig.findUnique).mockResolvedValueOnce(mockDbConfig as unknown as SystemConfig)

    const result = await getPublicStoreConfig()
    expect(result.storeName).toBe('Baso Ojolali Cabang Cirebon')
    expect(result.storeEmail).toBe('cabang@ojolali.com')
    expect(result.isOpen).toBe(true)
    expect(result.soundVolume).toBe(50)
  })

  it('harus menggunakan DEFAULT_STORE_CONFIG jika database mengembalikan null', async () => {
    vi.mocked(db.systemConfig.findUnique).mockResolvedValueOnce(null)

    const result = await getPublicStoreConfig()
    expect(result.storeName).toBe(DEFAULT_STORE_CONFIG.storeName)
    expect(result.storeEmail).toBe(DEFAULT_STORE_CONFIG.storeEmail)
    expect(result.isOpen).toBe(DEFAULT_STORE_CONFIG.isOpen)
  })

  it('harus fallback ke DEFAULT_STORE_CONFIG jika terjadi exception database (resilience)', async () => {
    vi.mocked(db.systemConfig.findUnique).mockRejectedValueOnce(
      new Error('Connection timeout to database server')
    )

    const result = await getPublicStoreConfig()
    expect(result.storeName).toBe(DEFAULT_STORE_CONFIG.storeName)
    expect(result.isOpen).toBe(true)
  })

  it('harus mengembalikan isOpen=true jika toko berstatus buka', async () => {
    vi.mocked(db.systemConfig.findUnique).mockResolvedValueOnce({
      ...DEFAULT_STORE_CONFIG,
      id: 'default',
      isOpen: true,
    } as unknown as SystemConfig)

    const status = await checkIsStoreOpen()
    expect(status.isOpen).toBe(true)
    expect(status.message).toBeUndefined()
  })

  it('harus mengembalikan isOpen=false dan pesan penutupan toko jika toko tutup', async () => {
    vi.mocked(db.systemConfig.findUnique).mockResolvedValueOnce({
      ...DEFAULT_STORE_CONFIG,
      id: 'default',
      isOpen: false,
    } as unknown as SystemConfig)

    const status = await checkIsStoreOpen()
    expect(status.isOpen).toBe(false)
    expect(status.message).toBe('Maaf, toko sedang tutup dan belum menerima pesanan.')
  })
})

