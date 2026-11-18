/**
 * WhatsApp Helper Utilities untuk UMKM Baso & Mie Ayam Ojolali
 * Nomor resmi tujuan: 6281316520717
 */

export const OJOLALI_WA_NUMBER = '6281316520717'
export const OJOLALI_WA_DISPLAY = '0813-1652-0717'

export interface WhatsAppOrderItem {
  quantity: number
  price?: number
  subtotal?: number
  noodleType?: string | null
  spiceLevel?: string | null
  notes?: string | null
  product?: {
    name: string
  } | null
  name?: string
}

export interface WhatsAppOrderInput {
  orderNumber: string
  customerName?: string | null
  customerPhone?: string | null
  totalAmount: number
  orderStatus: string
  paymentStatus?: string | null
  paymentMethod?: string | null
  createdAt?: Date | string
  items?: WhatsAppOrderItem[]
}

/**
 * Menghasilkan teks pesan WhatsApp yang terstruktur rapi dan siap dikirim
 */
export function buildOrderWhatsAppText(order: WhatsAppOrderInput): string {
  const customerName = order.customerName?.trim() || 'Pelanggan'
  
  let menuList = '- (Tidak ada detail item)'
  if (order.items && order.items.length > 0) {
    menuList = order.items
      .map((item, index) => {
        const productName = item.product?.name || item.name || 'Menu Ojolali'
        const customParts: string[] = []
        if (item.noodleType) customParts.push(`Mie: ${item.noodleType}`)
        if (item.spiceLevel) customParts.push(`Pedas: ${item.spiceLevel}`)
        if (item.notes) customParts.push(`Catatan: ${item.notes}`)
        
        const customStr = customParts.length > 0 ? ` [${customParts.join(', ')}]` : ''
        return `${index + 1}. ${productName} x${item.quantity}${customStr}`
      })
      .join('\n')
  }

  const lines = [
    `*NOTIFIKASI PESANAN - BASO & MIE AYAM OJOLALI*`,
    `----------------------------------------`,
    `*No. Pesanan:* #${order.orderNumber}`,
    `*Nama Pelanggan:* ${customerName}`,
    ...(order.customerPhone ? [`*No. WhatsApp:* ${order.customerPhone}`] : []),
    `*Status Pesanan:* ${order.orderStatus}`,
    ...(order.paymentMethod ? [`*Metode Pembayaran:* ${order.paymentMethod}`] : []),
    ...(order.paymentStatus ? [`*Status Pembayaran:* ${order.paymentStatus}`] : []),
    `----------------------------------------`,
    `*Daftar Menu Dipesan:*`,
    menuList,
    `----------------------------------------`,
    `*Total Tagihan:* Rp${order.totalAmount.toLocaleString('id-ID')}`,
    `----------------------------------------`,
    `_Halo Baso & Mie Ayam Ojolali, mohon konfirmasi pesanan ini. Terima kasih!_`
  ]

  return lines.join('\n')
}

/**
 * Menghasilkan link tautan wa.me dengan pesan yang telah di-encode
 */
export function getWhatsAppOrderUrl(
  order: WhatsAppOrderInput,
  targetPhone: string = OJOLALI_WA_NUMBER
): string {
  const message = buildOrderWhatsAppText(order)
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
}
