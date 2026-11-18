/**
 * Modul Utilitas Perhitungan Pesanan & Pengolahan Data Transaksi
 * UMKM Baso & Mie Ayam Ojolali
 */

export interface OrderItemCalculationInput {
  price: number
  quantity: number
}

export interface TransactionOrderItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  subtotal: number
}

export interface TransactionOrder {
  id?: string
  totalAmount: number
  items: TransactionOrderItem[]
}

export interface SalesAnalytics {
  totalPendapatan: number
  totalProdukTerjual: number
  totalTransaksi: number
  averageOrderValue: number
  productSales: Array<{
    productId: string
    name: string
    categoryName: string
    qty: number
    total: number
  }>
  categorySales: Array<{
    name: string
    qty: number
    total: number
  }>
}

export const ALLOWED_BAKSO_NOODLES = ['Mie Kuning', 'Mie Bihun', 'Mie Kuning + Bihun'] as const

/**
 * Menghitung subtotal untuk 1 item pesanan
 */
export function calculateItemSubtotal(price: number, quantity: number): number {
  if (price <= 0 || quantity <= 0) return 0
  return Math.round(price * quantity)
}

/**
 * Menghitung total keseluruhan dari daftar item pesanan
 */
export function calculateOrderTotal(items: OrderItemCalculationInput[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((total, item) => total + calculateItemSubtotal(item.price, item.quantity), 0)
}

/**
 * Format angka ke format mata uang Rupiah Indonesia (RpX.XXX)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'Rp0'
  return `Rp${Math.round(amount).toLocaleString('id-ID')}`
}

/**
 * Membuat nomor order standar Ojolali (ORD-YYYYMMDD-XXX)
 */
export function generateOrderNumber(dateStr: string, sequenceNumber: number): string {
  const cleanDate = dateStr.replace(/-/g, '')
  const safeSequence = Math.max(1, Math.floor(sequenceNumber))
  return `ORD-${cleanDate}-${safeSequence.toString().padStart(3, '0')}`
}

/**
 * Memvalidasi apakah jenis mie yang dipilih valid untuk kategori Bakso
 */
export function isValidBaksoNoodle(categoryName: string, noodleType?: string | null): boolean {
  const cat = (categoryName || '').toLowerCase().trim()
  const isBakso = cat === 'bakso' || cat === 'baso'

  if (!isBakso) return true // Non-bakso (misal minuman/tambahan) tidak mewajibkan mie
  if (!noodleType || typeof noodleType !== 'string') return false

  return (ALLOWED_BAKSO_NOODLES as readonly string[]).includes(noodleType.trim())
}

/**
 * Mengolah dan mengagregasi data transaksi penjualan (seperti di Laporan Penjualan Admin)
 */
export function aggregateSalesAnalytics(orders: TransactionOrder[]): SalesAnalytics {
  if (!orders || orders.length === 0) {
    return {
      totalPendapatan: 0,
      totalProdukTerjual: 0,
      totalTransaksi: 0,
      averageOrderValue: 0,
      productSales: [],
      categorySales: [],
    }
  }

  let totalPendapatan = 0
  let totalProdukTerjual = 0

  const productMap: Record<
    string,
    { productId: string; name: string; categoryName: string; qty: number; total: number }
  > = {}
  const categoryMap: Record<string, { name: string; qty: number; total: number }> = {}

  for (const order of orders) {
    totalPendapatan += Math.max(0, order.totalAmount)
    for (const item of order.items) {
      const qty = Math.max(0, item.quantity)
      const subtotal = Math.max(0, item.subtotal)

      totalProdukTerjual += qty
      const prodId = item.productId || item.productName
      const catName = item.categoryName || 'Lainnya'

      // Agregasi per produk
      if (!productMap[prodId]) {
        productMap[prodId] = {
          productId: prodId,
          name: item.productName,
          categoryName: catName,
          qty: 0,
          total: 0,
        }
      }
      productMap[prodId].qty += qty
      productMap[prodId].total += subtotal

      // Agregasi per kategori
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, qty: 0, total: 0 }
      }
      categoryMap[catName].qty += qty
      categoryMap[catName].total += subtotal
    }
  }

  const sortedProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty)
  const sortedCategories = Object.values(categoryMap).sort((a, b) => b.total - a.total)
  const averageOrderValue =
    orders.length > 0 ? Math.round(totalPendapatan / orders.length) : 0

  return {
    totalPendapatan,
    totalProdukTerjual,
    totalTransaksi: orders.length,
    averageOrderValue,
    productSales: sortedProducts,
    categorySales: sortedCategories,
  }
}

