import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseDateFromQuery, getOperationalSummary } from '@/lib/aiDataService'
import { db } from '@/lib/db'

// Mocking Prisma DB
vi.mock('@/lib/db', () => ({
  db: {
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
  },
}))

describe('Unit Test: AI Data Service & Natural Language Date Query Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseDateFromQuery', () => {
    it('harus mendeteksi kueri relatif "hari ini" dan "today"', () => {
      const resultToday = parseDateFromQuery('Berapa pesanan hari ini?')
      expect(resultToday).not.toBeNull()
      expect(resultToday?.type).toBe('date')
      expect(resultToday?.startWib).toBeInstanceOf(Date)
      expect(resultToday?.endWib).toBeInstanceOf(Date)

      const resultEnglish = parseDateFromQuery('Show me orders today')
      expect(resultEnglish).not.toBeNull()
    })

    it('harus mendeteksi kueri relatif "kemarin"', () => {
      const result = parseDateFromQuery('Berapa transaksi kemarin?')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
    })

    it('harus mem-parsing tanggal dengan nama bulan Indonesia (contoh: "31 oktober 2026")', () => {
      const result = parseDateFromQuery('Lihat omzet pada tanggal 31 oktober 2026')
      expect(result).not.toBeNull()
      expect(result?.label).toBe('31 Oktober 2026')
      expect(result?.type).toBe('date')
    })

    it('harus mem-parsing tanggal berformat ISO (contoh: "2026-11-18")', () => {
      const result = parseDateFromQuery('transaksi 2026-11-18')
      expect(result).not.toBeNull()
      expect(result?.label).toBe('18 November 2026')
    })

    it('harus mengembalikan null untuk pertanyaan umum tanpa unsur tanggal', () => {
      expect(parseDateFromQuery('Menu apa yang paling laris?')).toBeNull()
      expect(parseDateFromQuery('Siapa pelanggan yang paling sering beli?')).toBeNull()
      expect(parseDateFromQuery('Halo siapa kamu?')).toBeNull()
    })
  })

  describe('getOperationalSummary (Prisma Mocked)', () => {
    it('harus menolak akses untuk role non-staf (PELANGGAN atau GUEST) dengan mengembalikan null', async () => {
      const pelangganSummary = await getOperationalSummary('PELANGGAN')
      expect(pelangganSummary).toBeNull()

      const guestSummary = await getOperationalSummary('GUEST')
      expect(guestSummary).toBeNull()
    })

    it('harus mengagregasi data operasional untuk role ADMIN ketika data database tersedia', async () => {
      // Mock hasil database query
      vi.mocked(db.order.count)
        .mockResolvedValueOnce(25) // totalTransaksiSelesai
        .mockResolvedValueOnce(3)  // pesananMenunggu
        .mockResolvedValueOnce(5)  // transaksiSelesaiHariIni
        .mockResolvedValueOnce(2)  // pesananHariIniMenunggu
        .mockResolvedValueOnce(7)  // totalPesananHariIni
        .mockResolvedValueOnce(30) // totalPesananSemua

      vi.mocked(db.order.aggregate)
        .mockResolvedValueOnce({ _sum: { totalAmount: 450000 } } as any) // totalOmzetRiwayatAgg
        .mockResolvedValueOnce({ _sum: { totalAmount: 90000 } } as any)  // omzetHariIniAgg

      vi.mocked(db.user.count).mockResolvedValueOnce(6) // totalPelangganUser
      vi.mocked(db.product.count).mockResolvedValueOnce(30) // totalMenuProduk
      vi.mocked(db.order.findMany).mockResolvedValueOnce([]) // activeOrdersList

      const summary = await getOperationalSummary('ADMIN')
      expect(summary).not.toBeNull()
      expect(summary?.totalTransaksiSelesai).toBe(25)
      expect(summary?.totalOmzetRiwayat).toBe(450000)
      expect(summary?.pesananMenunggu).toBe(3)
      expect(summary?.transaksiSelesaiHariIni).toBe(5)
      expect(summary?.omzetHariIni).toBe(90000)
      expect(summary?.totalPelangganUser).toBe(6)
      expect(summary?.totalMenuProduk).toBe(30)
    })
  })
})

