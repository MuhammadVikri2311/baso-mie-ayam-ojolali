import { describe, it, expect } from 'vitest'
import {
  calculateItemSubtotal,
  calculateOrderTotal,
  formatRupiah,
  generateOrderNumber,
  isValidBaksoNoodle,
} from '@/lib/orderCalculation'

describe('Unit Test: Perhitungan Subtotal, Total Pesanan & Utilitas Order', () => {
  describe('calculateItemSubtotal', () => {
    it('harus menghitung subtotal harga x kuantitas dengan benar', () => {
      expect(calculateItemSubtotal(18000, 2)).toBe(36000)
      expect(calculateItemSubtotal(12000, 1)).toBe(12000)
      expect(calculateItemSubtotal(5000, 4)).toBe(20000)
    })

    it('harus mengembalikan 0 jika kuantitas adalah 0 (kondisi batas)', () => {
      expect(calculateItemSubtotal(18000, 0)).toBe(0)
    })

    it('harus mengembalikan 0 jika harga 0 (kondisi batas promo)', () => {
      expect(calculateItemSubtotal(0, 5)).toBe(0)
    })

    it('harus menangani angka negatif dengan aman (mengembalikan 0)', () => {
      expect(calculateItemSubtotal(-18000, 2)).toBe(0)
      expect(calculateItemSubtotal(18000, -2)).toBe(0)
      expect(calculateItemSubtotal(-1000, -5)).toBe(0)
    })
  })

  describe('calculateOrderTotal', () => {
    it('harus menghitung total pesanan dari banyak item secara akurat', () => {
      const items = [
        { price: 18000, quantity: 2 }, // 36.000
        { price: 14000, quantity: 1 }, // 14.000
        { price: 5000, quantity: 3 },  // 15.000
      ]

      const total = calculateOrderTotal(items)
      expect(total).toBe(65000)
    })

    it('harus mengembalikan 0 jika daftar item kosong (kondisi batas)', () => {
      expect(calculateOrderTotal([])).toBe(0)
    })

    it('harus mengabaikan item bernilai negatif dalam total', () => {
      const mixedItems = [
        { price: 12000, quantity: 2 }, // 24.000
        { price: -5000, quantity: 1 }, // 0
      ]

      expect(calculateOrderTotal(mixedItems)).toBe(24000)
    })
  })

  describe('formatRupiah', () => {
    it('harus memformat angka ke representasi mata uang Rupiah Indonesia', () => {
      expect(formatRupiah(18000)).toBe('Rp18.000')
      expect(formatRupiah(150000)).toBe('Rp150.000')
      expect(formatRupiah(1250500)).toBe('Rp1.250.500')
    })

    it('harus mengembalikan "Rp0" untuk angka 0, NaN, atau negatif', () => {
      expect(formatRupiah(0)).toBe('Rp0')
      expect(formatRupiah(-5000)).toBe('Rp0')
      expect(formatRupiah(NaN)).toBe('Rp0')
    })
  })

  describe('generateOrderNumber', () => {
    it('harus menghasilkan nomor pesanan standar ORD-YYYYMMDD-XXX', () => {
      expect(generateOrderNumber('2026-11-18', 1)).toBe('ORD-20261118-001')
      expect(generateOrderNumber('2026-11-18', 15)).toBe('ORD-20261118-015')
      expect(generateOrderNumber('2026-11-18', 105)).toBe('ORD-20261118-105')
    })

    it('harus menangani sequence <= 0 dengan menjadikannya minimal sequence 1', () => {
      expect(generateOrderNumber('2026-11-18', 0)).toBe('ORD-20261118-001')
      expect(generateOrderNumber('2026-11-18', -10)).toBe('ORD-20261118-001')
    })
  })

  describe('isValidBaksoNoodle', () => {
    it('harus menerima pilihan mie yang diizinkan untuk kategori Bakso', () => {
      expect(isValidBaksoNoodle('Bakso', 'Mie Kuning')).toBe(true)
      expect(isValidBaksoNoodle('Bakso', 'Mie Bihun')).toBe(true)
      expect(isValidBaksoNoodle('Bakso', 'Mie Kuning + Bihun')).toBe(true)
      expect(isValidBaksoNoodle('baso', 'Mie Kuning')).toBe(true) // case-insensitive
    })

    it('harus menolak jika kategori Bakso tapi mie kosong atau tidak didukung', () => {
      expect(isValidBaksoNoodle('Bakso', null)).toBe(false)
      expect(isValidBaksoNoodle('Bakso', undefined)).toBe(false)
      expect(isValidBaksoNoodle('Bakso', '')).toBe(false)
      expect(isValidBaksoNoodle('Bakso', 'Kwetiau Goreng')).toBe(false)
    })

    it('harus selalu bernilai true untuk produk non-bakso (minuman, cemilan)', () => {
      expect(isValidBaksoNoodle('Minuman', null)).toBe(true)
      expect(isValidBaksoNoodle('Mie Ayam', null)).toBe(true)
      expect(isValidBaksoNoodle('Tambahan', null)).toBe(true)
    })
  })
})

