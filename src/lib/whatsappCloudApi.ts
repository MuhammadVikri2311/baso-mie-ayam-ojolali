/**
 * Layanan Resmi Meta WhatsApp Cloud API
 * Baso & Mie Ayam Ojolali
 * 
 * Endpoint resmi Meta:
 * https://graph.facebook.com/{version}/{phone_number_id}/messages
 */

import { OJOLALI_WA_NUMBER, buildOrderWhatsAppText, WhatsAppOrderInput } from './whatsapp'
import { db } from './db'

export interface WhatsAppConfigStatus {
  isConfigured: boolean
  missingKeys: string[]
  config: {
    hasAccessToken: boolean
    hasPhoneNumberId: boolean
    adminPhone: string
    apiVersion: string
  }
}

// In-flight locks untuk mencegah double-trigger bersamaan (concurrency debouncing)
const inFlightAdminOrders = new Set<string>()
const inFlightCustomerOrders = new Set<string>()

/**
 * Validasi ketersediaan variabel lingkungan untuk WhatsApp Cloud API
 */
export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE?.trim() || OJOLALI_WA_NUMBER
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0'

  const missingKeys: string[] = []
  if (!accessToken) missingKeys.push('WHATSAPP_ACCESS_TOKEN')
  if (!phoneNumberId) missingKeys.push('WHATSAPP_PHONE_NUMBER_ID')

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    config: {
      hasAccessToken: Boolean(accessToken),
      hasPhoneNumberId: Boolean(phoneNumberId),
      adminPhone,
      apiVersion,
    },
  }
}

/**
 * Format nomor telepon ke format internasional standar WhatsApp (tanpa tanda plus '+')
 * Contoh:
 *  - '0813-1652-0717' -> '6281316520717'
 *  - '+62 813 1652 0717' -> '6281316520717'
 *  - '6281316520717' -> '6281316520717'
 */
export function formatWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null

  // Hapus semua karakter non-digit (spasi, tanda strip, simbol '+', dll)
  let cleaned = phone.replace(/\D/g, '')
  if (!cleaned) return null

  // Ubah awalan 0 menjadi kode negara Indonesia (62)
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }

  // Validasi panjang nomor internasional standar (9 - 16 digit)
  if (cleaned.length < 9 || cleaned.length > 16) {
    return null
  }

  return cleaned
}

export interface SendWhatsAppResult {
  success: boolean
  skipped?: boolean
  messageId?: string
  error?: string
  status?: number
  reason?: string
  raw?: unknown
}

/**
 * Mengirim pesan teks langsung ke nomor tujuan menggunakan WhatsApp Cloud API resmi Meta
 */
export async function sendWhatsAppTextMessage(
  to: string,
  messageText: string
): Promise<SendWhatsAppResult> {
  const status = getWhatsAppConfigStatus()

  // 1. Validasi konfigurasi kredensial di .env.local
  if (!status.isConfigured) {
    const reason = `Kredensial WhatsApp Cloud API belum dikonfigurasi di .env.local (${status.missingKeys.join(', ')} masih kosong). Pengiriman pesan otomatis dilewati agar proses website tetap berjalan lancar.`
    console.error(`[WhatsApp Cloud API Error] ${reason}`)
    return {
      success: false,
      skipped: true,
      reason,
      error: reason,
    }
  }

  // 2. Validasi format nomor telepon penerima
  const formattedTo = formatWhatsAppNumber(to)
  if (!formattedTo) {
    const reason = `Nomor telepon tujuan tidak valid: "${to}". Pengiriman dibatalkan.`
    console.error(`[WhatsApp Cloud API Error] ${reason}`)
    return {
      success: false,
      skipped: true,
      reason,
      error: reason,
    }
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim()
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0'
  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText,
        },
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        `HTTP Error ${response.status}: ${response.statusText}`
      console.error(
        `[WhatsApp Cloud API Error] Gagal mengirim pesan ke ${formattedTo} (${response.status}):`,
        data?.error || data || response.statusText
      )
      return {
        success: false,
        status: response.status,
        error: errorMessage,
        raw: data,
      }
    }

    const messageId = data?.messages?.[0]?.id
    console.log(
      `[WhatsApp Cloud API Success] Pesan berhasil terkirim ke ${formattedTo} (Message ID: ${messageId || 'N/A'})`
    )

    return {
      success: true,
      messageId,
      raw: data,
    }
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'Kesalahan jaringan saat menghubungi Meta WhatsApp API'
    console.error(`[WhatsApp Cloud API Error] Network Error saat mengirim ke ${formattedTo}:`, errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }
}

export interface AdminOrderNotificationInput extends WhatsAppOrderInput {
  orderId?: string
}

/**
 * 1. Kirim detail pesanan baru ke nomor WhatsApp Admin saat pelanggan checkout
 * Dilengkapi pencegahan notifikasi ganda (in-flight concurrency lock & status DB).
 */
export async function sendOrderNotificationToAdmin(
  order: AdminOrderNotificationInput
): Promise<SendWhatsAppResult> {
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE?.trim() || OJOLALI_WA_NUMBER
  const orderIdentifier = order.orderId || order.orderNumber

  // Cegah pemanggilan berulang secara bersamaan (In-flight concurrency deduplication)
  if (orderIdentifier && inFlightAdminOrders.has(orderIdentifier)) {
    const reason = `Pengiriman notifikasi admin untuk pesanan #${order.orderNumber} sedang berjalan. Melewati pemanggilan berulang.`
    console.warn(`[WhatsApp Cloud API] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  // Cek database jika orderId tersedia: apakah sudah pernah dikirim sebelumnya?
  if (order.orderId) {
    try {
      const existingOrder = await db.order.findUnique({
        where: { id: order.orderId },
        select: { waAdminNotifiedAt: true },
      })
      if (existingOrder?.waAdminNotifiedAt) {
        const reason = `Notifikasi admin untuk pesanan #${order.orderNumber} sudah pernah dikirim sebelumnya pada ${existingOrder.waAdminNotifiedAt.toISOString()}. Melewati untuk mencegah notifikasi ganda.`
        console.log(`[WhatsApp Cloud API] ${reason}`)
        return { success: true, skipped: true, reason }
      }
    } catch (dbErr) {
      console.warn('[WhatsApp Cloud API] Gagal mengecek status notifikasi admin di DB:', dbErr)
    }
  }

  if (orderIdentifier) {
    inFlightAdminOrders.add(orderIdentifier)
  }

  try {
    const messageText = buildOrderWhatsAppText(order)
    const result = await sendWhatsAppTextMessage(adminPhone, messageText)

    // Jika pesan berhasil terkirim ke Meta API, tandai timestamp di database
    if (result.success && order.orderId) {
      try {
        await db.order.update({
          where: { id: order.orderId },
          data: { waAdminNotifiedAt: new Date() },
        })
      } catch (updateErr) {
        console.warn('[WhatsApp Cloud API] Gagal mencatat waAdminNotifiedAt di DB:', updateErr)
      }
    }

    return result
  } finally {
    if (orderIdentifier) {
      inFlightAdminOrders.delete(orderIdentifier)
    }
  }
}

export interface CustomerOrderCompletedInput {
  orderId?: string
  orderNumber: string
  customerName?: string | null
  customerPhone?: string | null
  totalAmount: number
  items?: { name: string; quantity: number }[]
}

/**
 * Susun pesan ramah pelanggan saat kasir menyelesaikan pesanan (SELESAI)
 */
export function buildCustomerOrderCompletedText(data: CustomerOrderCompletedInput): string {
  const customerName = data.customerName?.trim() || 'Pelanggan'
  let itemsSummary = ''
  if (data.items && data.items.length > 0) {
    itemsSummary = data.items.map((it) => `• ${it.name} x${it.quantity}`).join('\n')
  }

  const lines = [
    `*PESANAN SELESAI - BASO & MIE AYAM OJOLALI* 🍜`,
    `----------------------------------------`,
    `Halo Kak *${customerName}*,`,
    ``,
    `Kabar gembira! Pesanan Anda telah *SELESAI* disiapkan oleh dapur kami dan siap diambil / dinikmati.`,
    ``,
    `*No. Pesanan:* #${data.orderNumber}`,
    ...(itemsSummary ? [`*Daftar Menu:*\n${itemsSummary}`] : []),
    `*Total Pembayaran:* Rp${data.totalAmount.toLocaleString('id-ID')}`,
    `*Status Pesanan:* SELESAI`,
    `----------------------------------------`,
    `Silakan ambil pesanan Anda di kasir. Terima kasih telah memesan di *Baso & Mie Ayam Ojolali*! 🙏`,
    `_Selamat menikmati hidangan kami!_`
  ]

  return lines.join('\n')
}

/**
 * 2. Kirim notifikasi pesanan selesai ke nomor WhatsApp Pelanggan saat kasir menekan SELESAI
 * Dilengkapi pencegahan notifikasi ganda (in-flight concurrency lock & status DB).
 */
export async function sendOrderCompletedNotificationToCustomer(
  data: CustomerOrderCompletedInput
): Promise<SendWhatsAppResult> {
  if (!data.customerPhone) {
    const reason = `Nomor WhatsApp pelanggan tidak tersedia untuk pesanan #${data.orderNumber}. Melewati pengiriman notifikasi ke pelanggan.`
    console.log(`[WhatsApp Cloud API] ${reason}`)
    return {
      success: false,
      skipped: true,
      reason,
    }
  }

  const orderIdentifier = data.orderId || data.orderNumber

  // Cegah pemanggilan berulang secara bersamaan (In-flight concurrency deduplication)
  if (orderIdentifier && inFlightCustomerOrders.has(orderIdentifier)) {
    const reason = `Pengiriman notifikasi pelanggan untuk pesanan #${data.orderNumber} sedang berjalan. Melewati pemanggilan berulang.`
    console.warn(`[WhatsApp Cloud API] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  // Cek database jika orderId tersedia: apakah pelanggan sudah pernah diberi notifikasi?
  if (data.orderId) {
    try {
      const existingOrder = await db.order.findUnique({
        where: { id: data.orderId },
        select: { waCustomerNotifiedAt: true },
      })
      if (existingOrder?.waCustomerNotifiedAt) {
        const reason = `Notifikasi pelanggan untuk pesanan #${data.orderNumber} sudah pernah dikirim sebelumnya pada ${existingOrder.waCustomerNotifiedAt.toISOString()}. Melewati untuk mencegah notifikasi ganda.`
        console.log(`[WhatsApp Cloud API] ${reason}`)
        return { success: true, skipped: true, reason }
      }
    } catch (dbErr) {
      console.warn('[WhatsApp Cloud API] Gagal mengecek status notifikasi pelanggan di DB:', dbErr)
    }
  }

  if (orderIdentifier) {
    inFlightCustomerOrders.add(orderIdentifier)
  }

  try {
    const messageText = buildCustomerOrderCompletedText(data)
    const result = await sendWhatsAppTextMessage(data.customerPhone, messageText)

    // Jika pesan berhasil terkirim ke Meta API, tandai timestamp di database
    if (result.success && data.orderId) {
      try {
        await db.order.update({
          where: { id: data.orderId },
          data: { waCustomerNotifiedAt: new Date() },
        })
      } catch (updateErr) {
        console.warn('[WhatsApp Cloud API] Gagal mencatat waCustomerNotifiedAt di DB:', updateErr)
      }
    }

    return result
  } finally {
    if (orderIdentifier) {
      inFlightCustomerOrders.delete(orderIdentifier)
    }
  }
}
