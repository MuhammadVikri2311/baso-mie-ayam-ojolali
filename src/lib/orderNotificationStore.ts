'use client'

import { create } from 'zustand'
import { soundPlayer } from './soundPlayer'

export interface OrderNotificationItem {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  createdAt: string
  totalItemQty: number
  summaryText: string
}

interface OrderNotificationState {
  // Settings
  soundEnabled: boolean
  isAudioUnlocked: boolean
  autoplayBlocked: boolean
  soundInitialized: boolean
  toggleSound: () => boolean
  enableSound: () => boolean
  disableSound: () => void
  testSound: () => Promise<boolean>
  setAutoplayBlocked: (blocked: boolean) => void

  // Data
  orders: OrderNotificationItem[]
  unreadOrderIds: string[]
  activeToastOrder: OrderNotificationItem | null
  lastPollTimestamp: number | null

  // Internal Tracking (to prevent repeat sound)
  soundPlayedOrderIds: string[]
  knownOrderIds: string[]
  isInitialized: boolean

  // Actions
  setOrders: (orders: OrderNotificationItem[]) => void
  handleNewOrdersDetected: (incomingOrders: OrderNotificationItem[], onNewOrder?: () => void) => void
  markAsRead: (orderId: string) => void
  markAllAsRead: () => void
  dismissToast: () => void
  initializeSoundPreference: () => void
}

export const useOrderNotificationStore = create<OrderNotificationState>((set, get) => ({
  soundEnabled: true,
  isAudioUnlocked: false,
  autoplayBlocked: false,
  soundInitialized: false,
  orders: [],
  unreadOrderIds: [],
  activeToastOrder: null,
  lastPollTimestamp: null,
  soundPlayedOrderIds: [],
  knownOrderIds: [],
  isInitialized: false,

  initializeSoundPreference: () => {
    if (typeof window === 'undefined') return
    if (get().soundInitialized) return

    const stored = localStorage.getItem('ojolali_order_sound')
    // Default to true if not set yet, otherwise respect stored setting
    const enabled = stored === null ? true : stored === 'true'

    // Connect sound player autoplay callback
    soundPlayer.setAutoplayBlockedCallback((blocked) => {
      set({ autoplayBlocked: blocked })
    })

    set({
      soundEnabled: enabled,
      soundInitialized: true,
    })
  },

  setAutoplayBlocked: (blocked) => {
    set({ autoplayBlocked: blocked })
  },

  toggleSound: () => {
    const current = get().soundEnabled
    const next = !current

    if (typeof window !== 'undefined') {
      localStorage.setItem('ojolali_order_sound', next ? 'true' : 'false')
    }

    if (next) {
      // Activating sound requires user gesture to unlock AudioContext
      const unlocked = soundPlayer.unlockAudio()
      soundPlayer.playTestSound()
      set({ soundEnabled: true, isAudioUnlocked: unlocked, autoplayBlocked: false })
      return true
    } else {
      set({ soundEnabled: false })
      return false
    }
  },

  enableSound: () => {
    const unlocked = soundPlayer.unlockAudio()
    soundPlayer.playTestSound()
    if (typeof window !== 'undefined') {
      localStorage.setItem('ojolali_order_sound', 'true')
    }
    set({ soundEnabled: true, isAudioUnlocked: unlocked, autoplayBlocked: false })
    return true
  },

  disableSound: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ojolali_order_sound', 'false')
    }
    set({ soundEnabled: false })
  },

  testSound: async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ojolali_order_sound', 'true')
    }
    soundPlayer.unlockAudio()
    set({ soundEnabled: true, autoplayBlocked: false })
    const success = await soundPlayer.playTestSound()
    set({ isAudioUnlocked: true })
    return success
  },

  setOrders: (orders) => set({ orders }),

  handleNewOrdersDetected: (incomingOrders, onNewOrder) => {
    const state = get()
    const { isInitialized, knownOrderIds, soundPlayedOrderIds, soundEnabled, unreadOrderIds } = state

    // On initial mount/fetch, snapshot existing orders so old orders don't blast sound or spam toasts
    if (!isInitialized) {
      const allIds = incomingOrders.map((o) => o.id)
      // Unread on first load: pending orders
      const pendingIds = incomingOrders
        .filter((o) => o.paymentStatus === 'PENDING' && o.orderStatus !== 'DIBATALKAN')
        .map((o) => o.id)

      set({
        orders: incomingOrders,
        knownOrderIds: allIds,
        soundPlayedOrderIds: allIds, // Mark all current orders as already played sound
        unreadOrderIds: pendingIds,
        isInitialized: true,
        lastPollTimestamp: Date.now(),
      })
      return
    }

    // Identify brand new orders that arrived AFTER initial snapshot
    const newOrders = incomingOrders.filter((order) => !knownOrderIds.includes(order.id))

    if (newOrders.length === 0) {
      set({ orders: incomingOrders, lastPollTimestamp: Date.now() })
      return
    }

    // Process new orders
    const newSoundPlayedIds = [...soundPlayedOrderIds]
    const newKnownIds = [...knownOrderIds]
    const newUnreadIds = [...unreadOrderIds]
    let shouldPlaySound = false
    let latestOrderToToast: OrderNotificationItem | null = null

    for (const order of newOrders) {
      newKnownIds.push(order.id)

      // Ensure each order only ever triggers sound ONCE
      if (!newSoundPlayedIds.includes(order.id)) {
        newSoundPlayedIds.push(order.id)
        shouldPlaySound = true
        latestOrderToToast = order
      }

      if (!newUnreadIds.includes(order.id)) {
        newUnreadIds.push(order.id)
      }
    }

    // Play chime if sound is enabled
    if (shouldPlaySound && soundEnabled) {
      soundPlayer.playOrderChime()
    }

    set({
      orders: incomingOrders,
      knownOrderIds: newKnownIds,
      soundPlayedOrderIds: newSoundPlayedIds,
      unreadOrderIds: newUnreadIds,
      activeToastOrder: latestOrderToToast || state.activeToastOrder,
      lastPollTimestamp: Date.now(),
    })

    if (shouldPlaySound && onNewOrder) {
      onNewOrder()
    }
  },

  markAsRead: (orderId) => {
    set((state) => ({
      unreadOrderIds: state.unreadOrderIds.filter((id) => id !== orderId),
      activeToastOrder: state.activeToastOrder?.id === orderId ? null : state.activeToastOrder,
    }))
  },

  markAllAsRead: () => {
    set({ unreadOrderIds: [], activeToastOrder: null })
  },

  dismissToast: () => {
    set({ activeToastOrder: null })
  },
}))
