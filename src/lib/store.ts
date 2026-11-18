import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string | null
  noodleType?: string | null
  spiceLevel?: string | null
  notes?: string | null
}

export function getCartLineKey(item: Pick<CartItem, 'id' | 'noodleType' | 'spiceLevel' | 'notes'>) {
  return `${item.id}::${item.noodleType ?? ''}::${item.spiceLevel ?? ''}::${item.notes ?? ''}`
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (lineKey: string) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const lineKey = getCartLineKey(item)
          const existingItemIndex = state.items.findIndex(
            (i) => getCartLineKey(i) === lineKey
          )

          if (existingItemIndex !== -1) {
            const newItems = [...state.items]
            newItems[existingItemIndex] = { 
              ...newItems[existingItemIndex], 
              quantity: newItems[existingItemIndex].quantity + 1 
            }
            return { items: newItems }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },
      removeItem: (lineKey) => {
        set((state) => ({
          items: state.items.filter((i) => getCartLineKey(i) !== lineKey),
        }))
      },
      updateQuantity: (lineKey, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            getCartLineKey(i) === lineKey ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

export function useCartHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  )
}
