import { describe, it, expect } from 'vitest'
import {
  checkoutFormSchema,
  orderItemInputSchema,
  categoryFormSchema,
  productFormSchema,
} from '@/lib/validations'

describe('Unit Test: Validasi Form Checkout, Item & Menu (Zod)', () => {
  describe('checkoutFormSchema', () => {
    it('harus menerima data checkout pesanan yang valid', () => {
      const validCheckout = {
        customerName: 'Muhammad Vikri',
        customerEmail: 'vikrim714@gmail.com',
        customerPhone: '081316520717',
        paymentMethod: 'QRIS' as const,
        items: [
          {
            id: 'prod-bakso-rusuk',
            quantity: 2,
            noodleType: 'Mie Kuning',
            spiceLevel: 'Sedang',
            notes: 'Kuah dipisah',
          },
        ],
      }

      const result = checkoutFormSchema.safeParse(validCheckout)
      expect(result.success).toBe(true)
    })

    it('harus menerima nomor telepon format internasional +62 atau lokal 08', () => {
      const validPhones = ['081234567890', '+6281234567890', '6281234567890']

      for (const phone of validPhones) {
        const result = checkoutFormSchema.safeParse({
          customerName: 'Pelanggan',
          customerEmail: 'user@ojolali.com',
          customerPhone: phone,
          paymentMethod: 'CASH',
          items: [{ id: 'prod-1', quantity: 1 }],
        })
        expect(result.success).toBe(true)
      }
    })

    it('harus menolak keranjang belanja yang kosong (items = [])', () => {
      const emptyItemsCheckout = {
        customerName: 'Pelanggan',
        customerEmail: 'user@ojolali.com',
        customerPhone: '081234567890',
        paymentMethod: 'CASH',
        items: [],
      }

      const result = checkoutFormSchema.safeParse(emptyItemsCheckout)
      expect(result.success).toBe(false)
      if (!result.success) {
        const itemError = result.error.issues.find((i) => i.path.includes('items'))
        expect(itemError?.message).toBe('Keranjang belanja tidak boleh kosong')
      }
    })

    it('harus menolak metode pembayaran yang tidak didukung', () => {
      const invalidPayment = {
        customerName: 'Pelanggan',
        customerEmail: 'user@ojolali.com',
        paymentMethod: 'PAYPAL', // Bukan CASH, QRIS, TRANSFER
        items: [{ id: 'prod-1', quantity: 1 }],
      }

      const result = checkoutFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('harus menolak item dengan quantity 0 atau negatif (edge case)', () => {
      const invalidQuantities = [0, -1, -5]

      for (const qty of invalidQuantities) {
        const result = orderItemInputSchema.safeParse({
          id: 'prod-1',
          quantity: qty,
        })
        expect(result.success).toBe(false)
      }
    })

    it('harus membatasi panjang catatan pesanan (notes max 200 karakter)', () => {
      const longNote = 'A'.repeat(201)
      const result = orderItemInputSchema.safeParse({
        id: 'prod-1',
        quantity: 1,
        notes: longNote,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('categoryFormSchema & productFormSchema', () => {
    it('harus menolak nama kategori kosong atau terlalu panjang', () => {
      expect(categoryFormSchema.safeParse({ name: '' }).success).toBe(false)
      expect(categoryFormSchema.safeParse({ name: 'A'.repeat(51) }).success).toBe(false)
      expect(categoryFormSchema.safeParse({ name: 'Bakso Spesial' }).success).toBe(true)
    })

    it('harus menolak harga produk yang negatif', () => {
      const negativeProduct = {
        name: 'Bakso Urat',
        price: -12000,
        categoryId: 'cat-bakso',
      }
      const result = productFormSchema.safeParse(negativeProduct)
      expect(result.success).toBe(false)
    })

    it('harus menerima harga 0 untuk produk promo/gratis (edge case)', () => {
      const freeProduct = {
        name: 'Air Putih Hangat',
        price: 0,
        categoryId: 'cat-minuman',
      }
      const result = productFormSchema.safeParse(freeProduct)
      expect(result.success).toBe(true)
    })
  })
})

