import { db } from './db'

export interface PublicStoreConfig {
  storeName: string
  storeDescription: string
  storePhone: string
  storeEmail: string
  storeAddress: string
  openingHours: string
  isOpen: boolean
  notificationEnabled: boolean
  soundEnabled: boolean
  soundVolume: number
  emailOrderNotification: boolean
  emailPaymentNotification: boolean
  emailCompletionNotification: boolean
  aiEnabled: boolean
  aiRoleAdminEnabled: boolean
  aiRoleKasirEnabled: boolean
  aiRoleCustomerEnabled: boolean
}

export const DEFAULT_STORE_CONFIG: PublicStoreConfig = {
  storeName: 'Baso & Mie Ayam Ojolali',
  storeDescription: 'Kuliner baso sapi asli dan mie ayam lezat khas Cirebon pilihan keluarga.',
  storePhone: '081316520717',
  storeEmail: 'vikrim714@gmail.com',
  storeAddress: 'Jl. Gn. Galunggung Permai, Perumnas, No. 25 RT. 07 RW. 16, Kota Cirebon, Jawa Barat',
  openingHours: 'Setiap Hari: 10.00 - 21.00 WIB',
  isOpen: true,
  notificationEnabled: true,
  soundEnabled: true,
  soundVolume: 80,
  emailOrderNotification: true,
  emailPaymentNotification: true,
  emailCompletionNotification: true,
  aiEnabled: true,
  aiRoleAdminEnabled: true,
  aiRoleKasirEnabled: true,
  aiRoleCustomerEnabled: true,
}

/**
 * Mengambil konfigurasi toko publik dari database (atau fallback default jika belum ada)
 */
export async function getPublicStoreConfig(): Promise<PublicStoreConfig> {
  try {
    const config = await db.systemConfig.findUnique({
      where: { id: 'default' },
    })

    if (config) {
      return {
        storeName: config.storeName || DEFAULT_STORE_CONFIG.storeName,
        storeDescription: config.storeDescription || DEFAULT_STORE_CONFIG.storeDescription,
        storePhone: config.storePhone || DEFAULT_STORE_CONFIG.storePhone,
        storeEmail: config.storeEmail || DEFAULT_STORE_CONFIG.storeEmail,
        storeAddress: config.storeAddress || DEFAULT_STORE_CONFIG.storeAddress,
        openingHours: config.openingHours || DEFAULT_STORE_CONFIG.openingHours,
        isOpen: config.isOpen,
        notificationEnabled: config.notificationEnabled,
        soundEnabled: config.soundEnabled,
        soundVolume: config.soundVolume,
        emailOrderNotification: config.emailOrderNotification,
        emailPaymentNotification: config.emailPaymentNotification,
        emailCompletionNotification: config.emailCompletionNotification,
        aiEnabled: config.aiEnabled,
        aiRoleAdminEnabled: config.aiRoleAdminEnabled,
        aiRoleKasirEnabled: config.aiRoleKasirEnabled,
        aiRoleCustomerEnabled: config.aiRoleCustomerEnabled,
      }
    }
  } catch (error) {
    console.warn('[getPublicStoreConfig] Menggunakan fallback konfigurasi default:', error)
  }

  return DEFAULT_STORE_CONFIG
}

/**
 * Cek apakah toko saat ini berstatus buka dan menerima pesanan
 */
export async function checkIsStoreOpen(): Promise<{
  isOpen: boolean
  message?: string
  storeName: string
  openingHours: string
}> {
  const cfg = await getPublicStoreConfig()

  if (!cfg.isOpen) {
    return {
      isOpen: false,
      message: 'Maaf, toko sedang tutup dan belum menerima pesanan.',
      storeName: cfg.storeName,
      openingHours: cfg.openingHours,
    }
  }

  return {
    isOpen: true,
    storeName: cfg.storeName,
    openingHours: cfg.openingHours,
  }
}

