import { describe, it, expect, beforeEach } from 'vitest'
import { getCartLineKey, useCartStore } from '@/lib/store'

describe('Unit Test: State & Business Logic Keranjang Belanja (Cart Store)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  describe('getCartLineKey', () => {
    it('harus membuat unique line key dari kombinasi ID, mie, level pedas, dan catatan', () => {
      const item1 = {
        id: 'bakso-urat-1',
        noodleType: 'Mie Kuning',
        spiceLevel: 'Pedas',
        notes: 'Banyakin seledri',
      }
      expect(getCartLineKey(item1)).toBe('bakso-urat-1::Mie Kuning::Pedas::Banyakin seledri')
    })

    it('harus menangani nilai null atau undefined secara seragam dengan string kosong', () => {
      const itemNull = {
        id: 'es-teh-1',
        noodleType: null,
        spiceLevel: null,
        notes: null,
      }
      const itemUndefined = {
        id: 'es-teh-1',
      }
      expect(getCartLineKey(itemNull)).toBe('es-teh-1::::::')
      expect(getCartLineKey(itemUndefined)).toBe('es-teh-1::::::')
      expect(getCartLineKey(itemNull)).toBe(getCartLineKey(itemUndefined))
    })

    it('harus membedakan produk yang sama jika kustomisasi berbeda', () => {
      const orderA = { id: 'bakso-mercon', noodleType: 'Mie Kuning', spiceLevel: 'Pedas' }
      const orderB = { id: 'bakso-mercon', noodleType: 'Mie Bihun', spiceLevel: 'Pedas' }
      expect(getCartLineKey(orderA)).not.toBe(getCartLineKey(orderB))
    })
  })

  describe('useCartStore actions', () => {
    it('harus menambah item baru ke keranjang dengan quantity 1', () => {
      const store = useCartStore.getState()
      store.addItem({
        id: 'item-1',
        name: 'Bakso Rusuk',
        price: 18000,
        image: '/images/products/bakso-rusuk.webp',
        noodleType: 'Mie Kuning',
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(1)
      expect(state.items[0].name).toBe('Bakso Rusuk')
      expect(state.getTotal()).toBe(18000)
    })

    it('harus menambah quantity jika item dengan kustomisasi yang sama ditambahkan lagi', () => {
      const store = useCartStore.getState()
      const item = {
        id: 'item-1',
        name: 'Bakso Rusuk',
        price: 18000,
        image: null,
        noodleType: 'Mie Kuning',
      }

      store.addItem(item)
      store.addItem(item)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(2)
      expect(state.getTotal()).toBe(36000)
    })

    it('harus membuat 2 baris terpisah jika produk sama tapi kustomisasi mie berbeda', () => {
      const store = useCartStore.getState()
      store.addItem({
        id: 'item-1',
        name: 'Bakso Rusuk',
        price: 18000,
        image: null,
        noodleType: 'Mie Kuning',
      })
      store.addItem({
        id: 'item-1',
        name: 'Bakso Rusuk',
        price: 18000,
        image: null,
        noodleType: 'Mie Bihun',
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(2)
      expect(state.getTotal()).toBe(36000)
    })

    it('harus memperbarui quantity dan tidak membiarkan quantity < 1 (clamping)', () => {
      const store = useCartStore.getState()
      store.addItem({
        id: 'es-teh',
        name: 'Es Teh Manis',
        price: 4000,
        image: null,
      })

      const lineKey = getCartLineKey({ id: 'es-teh' })

      // Ubah jadi 5
      store.updateQuantity(lineKey, 5)
      expect(useCartStore.getState().items[0].quantity).toBe(5)
      expect(useCartStore.getState().getTotal()).toBe(20000)

      // Coba ubah ke angka 0 atau negatif (harus dicegah ke minimal 1)
      store.updateQuantity(lineKey, 0)
      expect(useCartStore.getState().items[0].quantity).toBe(1)

      store.updateQuantity(lineKey, -3)
      expect(useCartStore.getState().items[0].quantity).toBe(1)
    })

    it('harus menghapus item berdasarkan lineKey', () => {
      const store = useCartStore.getState()
      store.addItem({ id: 'item-a', name: 'Menu A', price: 10000, image: null })
      store.addItem({ id: 'item-b', name: 'Menu B', price: 15000, image: null })

      expect(useCartStore.getState().items).toHaveLength(2)

      const lineKeyA = getCartLineKey({ id: 'item-a' })
      store.removeItem(lineKeyA)

      const remaining = useCartStore.getState().items
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('item-b')
      expect(useCartStore.getState().getTotal()).toBe(15000)
    })

    it('harus mengosongkan seluruh keranjang saat clearCart dipanggil', () => {
      const store = useCartStore.getState()
      store.addItem({ id: 'item-a', name: 'Menu A', price: 10000, image: null })
      store.addItem({ id: 'item-b', name: 'Menu B', price: 15000, image: null })

      store.clearCart()
      expect(useCartStore.getState().items).toHaveLength(0)
      expect(useCartStore.getState().getTotal()).toBe(0)
    })
  })
})

