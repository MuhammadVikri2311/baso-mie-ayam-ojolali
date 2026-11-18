'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrderNotificationStore } from '@/lib/orderNotificationStore'

let activeSubscribers = 0
let pollingInterval: NodeJS.Timeout | null = null
let isFetching = false

async function doFetchOrders(onNewOrder?: () => void) {
  if (isFetching) return

  isFetching = true
  try {
    const res = await fetch('/api/notifications/orders', {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return

    const data = await res.json()
    if (data.success && Array.isArray(data.orders)) {
      useOrderNotificationStore.getState().handleNewOrdersDetected(data.orders, onNewOrder)
    }
  } catch {
    // Ignore transient network errors during background polling
  } finally {
    isFetching = false
  }
}

export function useOrderNotification(role: 'admin' | 'kasir') {
  const router = useRouter()

  // Select individual slices from Zustand store (avoids full-store object re-render thrashing)
  const soundEnabled = useOrderNotificationStore((s) => s.soundEnabled)
  const isAudioUnlocked = useOrderNotificationStore((s) => s.isAudioUnlocked)
  const autoplayBlocked = useOrderNotificationStore((s) => s.autoplayBlocked)
  const orders = useOrderNotificationStore((s) => s.orders)
  const unreadOrderIds = useOrderNotificationStore((s) => s.unreadOrderIds)
  const activeToastOrder = useOrderNotificationStore((s) => s.activeToastOrder)
  const toggleSound = useOrderNotificationStore((s) => s.toggleSound)
  const testSound = useOrderNotificationStore((s) => s.testSound)
  const markAsRead = useOrderNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useOrderNotificationStore((s) => s.markAllAsRead)
  const dismissToast = useOrderNotificationStore((s) => s.dismissToast)

  useEffect(() => {
    // Initialize sound preference from localStorage once
    useOrderNotificationStore.getState().initializeSoundPreference()

    activeSubscribers++

    const handleRefresh = () => {
      router.refresh()
    }

    if (activeSubscribers === 1) {
      // First component mounted: trigger initial fetch and start interval
      doFetchOrders(handleRefresh)
      pollingInterval = setInterval(() => {
        doFetchOrders(handleRefresh)
      }, 3500)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && activeSubscribers > 0) {
        doFetchOrders(handleRefresh)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      activeSubscribers--
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (activeSubscribers <= 0) {
        activeSubscribers = 0
        if (pollingInterval) {
          clearInterval(pollingInterval)
          pollingInterval = null
        }
      }
    }
  }, [router])

  const targetPath = role === 'admin' ? '/admin/pesanan' : '/kasir/transaksi'

  const handleOrderClick = (orderId: string) => {
    markAsRead(orderId)
    router.push(targetPath)
  }

  return {
    soundEnabled,
    isAudioUnlocked,
    autoplayBlocked,
    orders,
    unreadOrderIds,
    activeToastOrder,
    toggleSound,
    testSound,
    markAsRead,
    markAllAsRead,
    dismissToast,
    targetPath,
    handleOrderClick,
  }
}
