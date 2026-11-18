import { describe, it, expect, vi, beforeEach } from 'vitest'
import { askAI } from '@/app/ai/actions'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Mocking dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    systemConfig: {
      findUnique: vi.fn().mockResolvedValue({
        aiEnabled: true,
        aiRoleAdminEnabled: true,
        aiRoleKasirEnabled: true,
        aiRoleCustomerEnabled: true,
      }),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

interface AuthOptionArg {
  cookies?: {
    sessionToken?: {
      name?: string
    }
  }
}

describe('Unit Test: Resolusi Identitas Pengguna & Anti-Role-Spoofing AI Chatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NVIDIA_API_KEY = 'mock-nvidia-nim-api-key-test'
  })

  // 1. Login ADMIN → bertanya "Saya siapa?" → jawaban harus Admin
  it('harus mengenali pengguna sebagai Admin saat login dengan sesi ADMIN dan bertanya "Saya siapa?"', async () => {
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-admin.session-token') {
        return {
          user: { id: 'admin-uid-1', role: 'ADMIN', name: 'Bapak Administrator' },
        }
      }
      return null
    })

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'admin-uid-1',
      name: 'Bapak Administrator',
      role: 'ADMIN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const result = await askAI('Saya siapa?', 'admin', undefined, [], '/admin')

    expect(result.error).toBeUndefined()
    expect(result.role).toBe('ADMIN')
    expect(result.message).toContain('Administrator (Admin)')
    expect(result.message).toContain('Bapak Administrator')
    expect(result.message).not.toContain('Petugas Kasir')
  })

  // 2. Login KASIR → bertanya "Saya siapa?" → jawaban harus Kasir
  it('harus mengenali pengguna sebagai Kasir saat login dengan sesi KASIR dan bertanya "Saya siapa?"', async () => {
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-kasir.session-token') {
        return {
          user: { id: 'kasir-uid-1', role: 'KASIR', name: 'Siti Kasir' },
        }
      }
      return null
    })

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'kasir-uid-1',
      name: 'Siti Kasir',
      role: 'KASIR',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const result = await askAI('Saya siapa?', 'kasir', undefined, [], '/kasir')

    expect(result.error).toBeUndefined()
    expect(result.role).toBe('KASIR')
    expect(result.message).toContain('Petugas Kasir')
    expect(result.message).toContain('Siti Kasir')
    expect(result.message).not.toContain('Administrator (Admin)')
  })

  // 3. Login PELANGGAN → bertanya "Saya siapa?" → jawaban harus Pelanggan
  it('harus mengenali pengguna sebagai Pelanggan saat login dengan sesi PELANGGAN dan bertanya "Saya siapa?"', async () => {
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-pelanggan.session-token') {
        return {
          user: { id: 'pelanggan-uid-1', role: 'PELANGGAN', name: 'Ahmad Pelanggan' },
        }
      }
      return null
    })

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'pelanggan-uid-1',
      name: 'Ahmad Pelanggan',
      role: 'PELANGGAN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const result = await askAI('Saya siapa?', 'pelanggan', undefined, [], '/menu')

    expect(result.error).toBeUndefined()
    expect(result.role).toBe('PELANGGAN')
    expect(result.message).toContain('Pelanggan')
    expect(result.message).toContain('Ahmad Pelanggan')
    expect(result.message).not.toContain('Administrator (Admin)')
    expect(result.message).not.toContain('Petugas Kasir')
  })

  // 4. Uji pergantian akun ADMIN → KASIR → PELANGGAN
  it('harus memperbarui identitas pengguna secara akurat saat berganti akun ADMIN -> KASIR -> PELANGGAN', async () => {
    // Tahap 1: Login sebagai ADMIN
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-admin.session-token') {
        return { user: { id: 'uid-admin', role: 'ADMIN', name: 'User Admin' } }
      }
      return null
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'uid-admin',
      name: 'User Admin',
      role: 'ADMIN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const resAdmin = await askAI('Siapa saya?', 'admin', undefined, [], '/admin')
    expect(resAdmin.role).toBe('ADMIN')
    expect(resAdmin.message).toContain('Administrator (Admin)')

    // Tahap 2: Beralih login sebagai KASIR
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-kasir.session-token') {
        return { user: { id: 'uid-kasir', role: 'KASIR', name: 'User Kasir' } }
      }
      return null
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'uid-kasir',
      name: 'User Kasir',
      role: 'KASIR',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const resKasir = await askAI('Siapa saya?', 'kasir', undefined, [], '/kasir')
    expect(resKasir.role).toBe('KASIR')
    expect(resKasir.message).toContain('Petugas Kasir')
    expect(resKasir.message).not.toContain('Administrator (Admin)')

    // Tahap 3: Beralih login sebagai PELANGGAN
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-pelanggan.session-token') {
        return { user: { id: 'uid-pelanggan', role: 'PELANGGAN', name: 'User Pelanggan' } }
      }
      return null
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'uid-pelanggan',
      name: 'User Pelanggan',
      role: 'PELANGGAN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const resPelanggan = await askAI('Siapa saya?', 'pelanggan', undefined, [], '/menu')
    expect(resPelanggan.role).toBe('PELANGGAN')
    expect(resPelanggan.message).toContain('Pelanggan')
    expect(resPelanggan.message).not.toContain('Administrator (Admin)')
    expect(resPelanggan.message).not.toContain('Petugas Kasir')
  })

  // 5. Uji dua akun berbeda agar konteks role tidak bocor
  it('harus mencegah kebocoran konteks identitas saat dua akun berbeda mengakses AI secara bergantian', async () => {
    // Akun A: Kasir
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-kasir.session-token') {
        return { user: { id: 'user-kasir-session', role: 'KASIR', name: 'Kasir Shift Pagi' } }
      }
      return null
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-kasir-session',
      name: 'Kasir Shift Pagi',
      role: 'KASIR',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const resA = await askAI('Saya siapa?', 'kasir', undefined, [], '/kasir')
    expect(resA.role).toBe('KASIR')
    expect(resA.message).toContain('Petugas Kasir')

    // Akun B: Pelanggan yang membawa sisa history chat lama dari Admin
    vi.mocked(getServerSession).mockImplementation(async (...args: unknown[]) => {
      const options = args[0] as AuthOptionArg | undefined
      if (options?.cookies?.sessionToken?.name === 'ojolali-pelanggan.session-token') {
        return { user: { id: 'user-pelanggan-session', role: 'PELANGGAN', name: 'Budi Santoso' } }
      }
      return null
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-pelanggan-session',
      name: 'Budi Santoso',
      role: 'PELANGGAN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const staleHistory = [
      { role: 'user' as const, content: 'Saya siapa?' },
      { role: 'ai' as const, content: 'Anda adalah Administrator (Admin) di UMKM Baso & Mie Ayam Ojolali.' },
    ]

    const resB = await askAI('Saya siapa?', 'pelanggan', undefined, staleHistory, '/menu')
    // Harus tetap mengenali Akun B sebagai Pelanggan, tanpa terpengaruh staleHistory Admin
    expect(resB.role).toBe('PELANGGAN')
    expect(resB.message).toContain('Pelanggan')
    expect(resB.message).toContain('Budi Santoso')
    expect(resB.message).not.toContain('Administrator')
  })

  // 6. Uji request tanpa sesi login → harus ditolak
  it('harus menolak permintaan jika pengguna tidak memiliki sesi login aktif', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const result = await askAI('Saya siapa?', 'pelanggan', undefined, [], '/menu')

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Akses ditolak')
    expect(result.message).toBeUndefined()
  })

  // 7. Pastikan tidak ada role yang di-hardcode (role murni bersumber dari database server)
  it('harus memvalidasi role secara dinamis berdasarkan data database, bukan nilai statis hardcode', async () => {
    vi.mocked(getServerSession).mockImplementation(async () => {
      return { user: { id: 'dynamic-user-1', role: 'PELANGGAN', name: 'User Dinamis' } }
    })

    // Skenario 1: Database mengembalikan role PELANGGAN
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'dynamic-user-1',
      name: 'User Dinamis',
      role: 'PELANGGAN',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const res1 = await askAI('Saya login sebagai apa?', undefined, undefined, [], '/')
    expect(res1.role).toBe('PELANGGAN')
    expect(res1.message).toContain('Pelanggan')

    // Skenario 2: Database diubah menjadi KASIR untuk user yang sama
    vi.mocked(getServerSession).mockImplementation(async () => {
      return { user: { id: 'dynamic-user-1', role: 'KASIR', name: 'User Dinamis' } }
    })
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'dynamic-user-1',
      name: 'User Dinamis',
      role: 'KASIR',
    } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>)

    const res2 = await askAI('Saya login sebagai apa?', undefined, undefined, [], '/')
    expect(res2.role).toBe('KASIR')
    expect(res2.message).toContain('Petugas Kasir')
  })
})
