import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/ai/route'
import { resolveAiContextData } from '@/lib/aiDataService'

// Mocking dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn(),
    },
    systemConfig: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/app/ai/actions', () => ({
  askAI: vi.fn().mockResolvedValue({
    message: 'Halo, ini respon AI aman.',
    products: [],
  }),
}))

describe('Unit Test: Hardening Keamanan API Chatbot AI (/api/ai)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Autentikasi Server-Side & Anti-Spoofing Tanpa Sesi', () => {
    it('harus menolak permintaan tanpa sesi autentikasi dengan status HTTP 401', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const req = new Request('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Halo' }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toContain('Akses ditolak')
    })

    it('harus menolak request yang mencoba memalsukan role=ADMIN di body jika tidak ada sesi server (HTTP 401)', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const req = new Request('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Berapa total omzet toko?',
          role: 'ADMIN',
          portal: 'admin',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toContain('Akses ditolak')
    })
  })

  describe('2. Validasi Input (Prompt & History)', () => {
    it('harus menolak jika prompt kosong dengan status HTTP 400', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-pelanggan-1', role: 'PELANGGAN', name: 'Pelanggan Setia' },
      })
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'user-pelanggan-1',
        name: 'Pelanggan Setia',
        role: 'PELANGGAN',
      } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

      const req = new Request('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '   ' }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('tidak boleh kosong')
    })

    it('harus menolak jika prompt melebihi 500 karakter dengan status HTTP 400', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-pelanggan-1', role: 'PELANGGAN', name: 'Pelanggan Setia' },
      })
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'user-pelanggan-1',
        name: 'Pelanggan Setia',
        role: 'PELANGGAN',
      } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

      const longPrompt = 'a'.repeat(501)
      const req = new Request('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: longPrompt }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('terlalu panjang')
    })

    it('harus menolak jika history memiliki format yang tidak valid dengan status HTTP 400', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-pelanggan-1', role: 'PELANGGAN', name: 'Pelanggan Setia' },
      })
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'user-pelanggan-1',
        name: 'Pelanggan Setia',
        role: 'PELANGGAN',
      } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

      const req = new Request('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Rekomendasi bakso',
          history: [{ role: 'hacker', content: 'test' }],
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('tidak valid')
    })
  })

  describe('3. Role-Based Access Control (RBAC) Kasir vs Admin', () => {
    it('harus membatasi Kasir agar tidak dapat membaca data akun master pelanggan terdaftar', async () => {
      const kasirResult = await resolveAiContextData('Berapa total pelanggan terdaftar?', 'KASIR')
      expect(kasirResult.intent).toBe('KASIR_CUSTOMER_RBAC')
      expect(kasirResult.primaryDataText).toContain('BATASAN HAK AKSES ROLE KASIR')
      expect(kasirResult.primaryDataText).toContain('dikelola oleh Administrator')
    })

    it('harus mengizinkan Admin membaca data jumlah pelanggan terdaftar', async () => {
      const { db } = await import('@/lib/db')
      vi.mocked(db.user.findMany).mockResolvedValue([
        { id: '1', name: 'User 1', email: 'u1@mail.com', createdAt: new Date() },
        { id: '2', name: 'User 2', email: 'u2@mail.com', createdAt: new Date() },
      ] as unknown as Awaited<ReturnType<typeof db.user.findMany>>)

      const adminResult = await resolveAiContextData('Berapa total pelanggan terdaftar?', 'ADMIN')
      expect(adminResult.intent).toBe('TOTAL_CUSTOMERS_COUNT')
      expect(adminResult.primaryDataText).toContain('2 pelanggan')
    })

    it('harus membatasi Pelanggan agar tidak mendapatkan data kontekstual internal', async () => {
      const customerResult = await resolveAiContextData('Berapa omzet hari ini?', 'PELANGGAN')
      expect(customerResult.intent).toBe('NONE')
      expect(customerResult.primaryDataText).toBe('')
    })
  })
})
