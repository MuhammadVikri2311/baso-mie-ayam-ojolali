import { db } from '@/lib/db'

export type UserRoleType = 'ADMIN' | 'KASIR' | 'PELANGGAN' | 'GUEST'

export interface ServiceResult<T> {
  allowed: boolean
  data?: T | null
  message?: string
  error?: string
}

export interface TransactionHistoryData {
  totalTransaksiSelesai: number
  totalOmzetRiwayat: number
  recentOrders: string[]
}

export interface OrdersByDateData {
  label: string
  totalOrders: number
  selesaiCount: number
  menungguCount: number
  paidCount: number
  totalOmzetPaid: number
  orderDetails: string[]
}

export interface CustomerStatItem {
  name: string
  orderCount: number
  completedCount: number
  paidCount: number
  totalSpent: number
}

export interface TopCustomersData {
  topByOrderCount: CustomerStatItem[]
  topBySpending: CustomerStatItem[]
  totalCustomersRecorded: number
}

export interface TodayOrdersData {
  dateString: string
  totalOrders: number
  menunggu: number
  diproses: number
  siap: number
  selesai: number
  dibatalkan: number
  paidCount: number
  totalPaidAmount: number
  customerNames: string[]
  recentOrders: {
    orderNumber: string
    customerName: string
    status: string
    payment: string
    total: number
    itemCount: number
  }[]
}

export interface WaitingOrderItem {
  id: string
  orderNumber: string
  customerName: string
  orderStatus: string
  paymentStatus: string
  totalAmount: number
  itemsSummary: string
  createdAt: string
}

export interface WaitingOrdersData {
  count: number
  orders: WaitingOrderItem[]
}

export interface TopProductItem {
  name: string
  category: string
  price: number
  totalQuantity: number
  totalRevenue: number
}

export interface TopSellingMenuData {
  topProducts: TopProductItem[]
}

export interface MonthlySalesData {
  monthString: string
  totalSalesPaid: number
  paidOrdersCount: number
  totalOrdersCount: number
  averagePerOrder: number
}

export interface CustomerOrderSummaryData {
  query: string
  totalFound: number
  totalSpentPaid?: number
  orders: {
    orderNumber: string
    customerName: string
    orderStatus: string
    paymentStatus: string
    totalAmount: number
    items: string
    createdAt: string
  }[]
}

/**
 * Helper retry untuk menangani jeda cold-start serverless database (Neon PostgreSQL)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }
  throw lastErr
}

export const INDO_MONTHS: Record<string, number> = {
  januari: 0, jan: 0,
  februari: 1, feb: 1, pebruari: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7, agt: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9, oct: 9, october: 9,
  november: 10, nov: 10, nopember: 10, nop: 10,
  desember: 11, des: 11, dec: 11, december: 11,
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Membuat rentang waktu WIB (UTC+7) untuk tanggal tertentu
 */
export function createWibDateRange(year: number, month: number, day: number) {
  // Awal hari WIB: 00:00:00 WIB = 17:00:00 UTC hari sebelumnya
  const startWib = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  // Akhir hari WIB: 23:59:59.999 WIB
  const endWib = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)
  return { startWib, endWib }
}

/**
 * Mendapatkan rentang waktu WIB (UTC+7) untuk hari ini
 */
export function getWibTodayRange() {
  const now = new Date()
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  
  const year = wibTime.getUTCFullYear()
  const month = wibTime.getUTCMonth()
  const date = wibTime.getUTCDate()
  
  const { startWib, endWib } = createWibDateRange(year, month, date)
  const dateString = `${String(date).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
  
  return { startWib, endWib, dateString }
}

/**
 * Mendapatkan rentang waktu WIB (UTC+7) untuk bulan ini
 */
export function getWibMonthRange() {
  const now = new Date()
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  
  const year = wibTime.getUTCFullYear()
  const month = wibTime.getUTCMonth()
  
  const startWib = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  const endWib = new Date(nextMonthStart.getTime() - 1)
  
  const monthString = `${MONTH_NAMES_ID[month]} ${year}`
  return { startWib, endWib, monthString }
}

/**
 * Deteksi dan parsing tanggal dari pertanyaan pengguna (relatif dan absolut)
 */
export function parseDateFromQuery(query: string): {
  type: 'date' | 'month'
  label: string
  startWib: Date
  endWib: Date
} | null {
  const lower = query.toLowerCase()

  // 1. Relatif: kemarin
  if (/\b(kemarin|yesterday)\b/.test(lower)) {
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    wib.setUTCDate(wib.getUTCDate() - 1)
    const y = wib.getUTCFullYear()
    const m = wib.getUTCMonth()
    const d = wib.getUTCDate()
    const range = createWibDateRange(y, m, d)
    return {
      type: 'date',
      label: `${d} ${MONTH_NAMES_ID[m]} ${y}`,
      ...range,
    }
  }

  // 2. Relatif: hari ini
  if (/\b(hari ini|today)\b/.test(lower)) {
    const { startWib, endWib } = getWibTodayRange()
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    const d = wib.getUTCDate()
    const m = wib.getUTCMonth()
    const y = wib.getUTCFullYear()
    return {
      type: 'date',
      label: `${d} ${MONTH_NAMES_ID[m]} ${y}`,
      startWib,
      endWib,
    }
  }

  // 3. Eksplisit tanggal dengan nama bulan Indonesia: "31 oktober", "31 oktober 2026", "tgl 12 nov"
  const monthKeys = Object.keys(INDO_MONTHS).join('|')
  const dateWithMonthRegex = new RegExp(
    `\\b(?:tanggal|tgl)?\\s*(\\d{1,2})\\s*(?:-|\\s+)?(${monthKeys})\\s*(?:(\\d{4}))?\\b`,
    'i'
  )
  const match = lower.match(dateWithMonthRegex)
  if (match) {
    const day = parseInt(match[1], 10)
    const monthKey = match[2].toLowerCase()
    const month = INDO_MONTHS[monthKey]
    const now = new Date()
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    const year = match[3] ? parseInt(match[3], 10) : wibNow.getUTCFullYear()

    if (day >= 1 && day <= 31 && month !== undefined) {
      const range = createWibDateRange(year, month, day)
      return {
        type: 'date',
        label: `${day} ${MONTH_NAMES_ID[month]} ${year}`,
        ...range,
      }
    }
  }

  // 4. Format ISO: "2026-10-31"
  const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10) - 1
    const d = parseInt(isoMatch[3], 10)
    if (d >= 1 && d <= 31 && m >= 0 && m <= 11) {
      const range = createWibDateRange(y, m, d)
      return {
        type: 'date',
        label: `${d} ${MONTH_NAMES_ID[m]} ${y}`,
        ...range,
      }
    }
  }

  // 5. Format garis miring: "31/10/2026" atau "31/10"
  const slashMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10)
    const m = parseInt(slashMatch[2], 10) - 1
    const now = new Date()
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    let y = slashMatch[3] ? parseInt(slashMatch[3], 10) : wibNow.getUTCFullYear()
    if (y < 100) y += 2000
    if (d >= 1 && d <= 31 && m >= 0 && m <= 11) {
      const range = createWibDateRange(y, m, d)
      return {
        type: 'date',
        label: `${d} ${MONTH_NAMES_ID[m]} ${y}`,
        ...range,
      }
    }
  }

  return null
}

/**
 * Ringkasan Operasional Real-time untuk Context Prompt Staf (Kasir & Admin)
 */
export async function getOperationalSummary(role: UserRoleType) {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return null
  }

  return withRetry(async () => {
    const { startWib, endWib, dateString } = getWibTodayRange()

    const [
      totalTransaksiSelesai,
      totalOmzetRiwayatAgg,
      pesananMenunggu,
      transaksiSelesaiHariIni,
      omzetHariIniAgg,
      pesananHariIniMenunggu,
      totalPesananHariIni,
      totalPesananSemua,
      totalPelangganUser,
      totalMenuProduk,
      activeOrdersList,
    ] = await Promise.all([
      // 1. Total transaksi selesai riwayat (/kasir/riwayat)
      db.order.count({
        where: {
          orderStatus: 'SELESAI',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      }),
      // 2. Total omzet riwayat transaksi selesai (/kasir/riwayat)
      db.order.aggregate({
        where: {
          orderStatus: 'SELESAI',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        _sum: { totalAmount: true },
      }),
      // 3. Pesanan menunggu saat ini (/kasir/transaksi)
      db.order.count({
        where: {
          orderStatus: 'MENUNGGU',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      }),
      // 4. Transaksi selesai hari ini WIB
      db.order.count({
        where: {
          createdAt: { gte: startWib, lte: endWib },
          orderStatus: 'SELESAI',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      }),
      // 5. Omzet lunas hari ini WIB (/kasir)
      db.order.aggregate({
        where: {
          createdAt: { gte: startWib, lte: endWib },
          paymentStatus: 'PAID',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        _sum: { totalAmount: true },
      }),
      // 6. Pesanan hari ini yang berstatus menunggu
      db.order.count({
        where: {
          createdAt: { gte: startWib, lte: endWib },
          orderStatus: 'MENUNGGU',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      }),
      // 7. Total pesanan masuk hari ini WIB
      db.order.count({
        where: {
          createdAt: { gte: startWib, lte: endWib },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      }),
      // 8. Total pesanan sepanjang masa (/admin)
      db.order.count({
        where: { orderNumber: { not: { startsWith: 'TEST-' } } },
      }),
      // 9. Total pelanggan terdaftar di sistem (/admin)
      db.user.count({ where: { role: 'PELANGGAN' } }),
      // 10. Total menu produk (/admin/menu)
      db.product.count(),
      // 11. Antrean pesanan aktif saat ini
      db.order.findMany({
        where: {
          orderStatus: { notIn: ['SELESAI', 'DIBATALKAN'] },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          payment: { select: { paymentMethod: true } },
          user: { select: { name: true } },
        },
      }),
    ])

    const totalOmzetRiwayat = totalOmzetRiwayatAgg._sum.totalAmount || 0
    const omzetHariIni = omzetHariIniAgg._sum.totalAmount || 0

    const activeList = activeOrdersList.map((o) => {
      const itemsDesc = o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')
      return `- #${o.orderNumber} | Pelanggan: ${o.customerName || o.user?.name || 'Tamu'} | Total: Rp${o.totalAmount.toLocaleString('id-ID')} | Status: ${o.orderStatus} | Bayar: ${o.paymentStatus} (${o.payment?.paymentMethod || 'CASH'}) | Menu: ${itemsDesc || 'Item pesanan'}`
    })

    return {
      dateString,
      totalTransaksiSelesai,
      totalOmzetRiwayat,
      pesananMenunggu,
      transaksiSelesaiHariIni,
      omzetHariIni,
      pesananHariIniMenunggu,
      totalPesananHariIni,
      totalPesananSemua,
      totalPelangganUser,
      totalMenuProduk,
      activeOrdersFormatted: activeList,
    }
  })
}

/**
 * 1. Riwayat Transaksi Kasir & Total Transaksi Selesai (Konsisten dengan /kasir/riwayat)
 */
export async function getTransactionHistorySummaryData(role: UserRoleType): Promise<ServiceResult<TransactionHistoryData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const [historyOrders, countSelesai, sumOmset] = await Promise.all([
        db.order.findMany({
          where: {
            orderStatus: 'SELESAI',
            orderNumber: { not: { startsWith: 'TEST-' } },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            items: {
              include: { product: { select: { name: true } } },
            },
            payment: { select: { paymentMethod: true } },
            user: { select: { name: true } },
          },
        }),
        db.order.count({
          where: {
            orderStatus: 'SELESAI',
            orderNumber: { not: { startsWith: 'TEST-' } },
          },
        }),
        db.order.aggregate({
          where: {
            orderStatus: 'SELESAI',
            orderNumber: { not: { startsWith: 'TEST-' } },
          },
          _sum: { totalAmount: true },
        }),
      ])

      const totalOmset = sumOmset._sum.totalAmount || 0

      const recentList = historyOrders.map((o) => {
        const itemsStr = o.items
          .map((i) => `${i.quantity}x ${i.product.name}`)
          .join(', ')
        const wibDate = new Date(o.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        return `- #${o.orderNumber} (${wibDate}) | Pelanggan: ${o.customerName || o.user?.name || 'Tamu'} | Total: Rp${o.totalAmount.toLocaleString('id-ID')} | Bayar: ${o.payment?.paymentMethod || 'CASH'} | Menu: ${itemsStr || 'Pesanan'}`
      })

      return {
        allowed: true,
        data: {
          totalTransaksiSelesai: countSelesai,
          totalOmzetRiwayat: totalOmset,
          recentOrders: recentList,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying transaction history:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query riwayat transaksi di database.',
      }
    }
  })
}

/**
 * 2. Transaksi Berdasarkan Tanggal Spesifik (WIB)
 */
export async function getOrdersByDateData(
  role: UserRoleType,
  dateInfo: { label: string; startWib: Date; endWib: Date }
): Promise<ServiceResult<OrdersByDateData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const orders = await db.order.findMany({
        where: {
          createdAt: {
            gte: dateInfo.startWib,
            lte: dateInfo.endWib,
          },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        orderBy: { createdAt: 'asc' },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          payment: { select: { paymentMethod: true } },
          user: { select: { name: true } },
        },
      })

      const totalOrders = orders.length
      const selesaiCount = orders.filter((o) => o.orderStatus === 'SELESAI').length
      const menungguCount = orders.filter((o) => o.orderStatus === 'MENUNGGU').length
      const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID')
      const totalOmzetPaid = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

      const orderDetails = orders.map((o) => {
        const itemsStr = o.items
          .map((i) => `${i.quantity}x ${i.product.name}`)
          .join(', ')
        const timeStr = new Date(o.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
        return `- #${o.orderNumber} (${timeStr} WIB) | Pelanggan: ${o.customerName || o.user?.name || 'Tamu'} | Total: Rp${o.totalAmount.toLocaleString('id-ID')} | Status: ${o.orderStatus} | Bayar: ${o.paymentStatus} (${o.payment?.paymentMethod || 'CASH'}) | Menu: ${itemsStr || 'Pesanan'}`
      })

      return {
        allowed: true,
        data: {
          label: dateInfo.label,
          totalOrders,
          selesaiCount,
          menungguCount,
          paidCount: paidOrders.length,
          totalOmzetPaid,
          orderDetails,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying orders by date:', err)
      return {
        allowed: true,
        error: `Gagal melakukan query data pesanan untuk tanggal ${dateInfo.label}.`,
      }
    }
  })
}

/**
 * 3. Pelanggan yang paling sering membeli & paling banyak belanja
 * Boleh diakses oleh ADMIN dan KASIR untuk data operasional pelanggan.
 */
export async function getTopCustomersData(role: UserRoleType, limit = 5): Promise<ServiceResult<TopCustomersData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const orders = await db.order.findMany({
        where: {
          orderStatus: { not: 'DIBATALKAN' },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      })

      if (orders.length === 0) {
        return {
          allowed: true,
          data: null,
          message: 'Belum ada data pesanan aktif di database.',
        }
      }

      const customerStats: Record<
        string,
        CustomerStatItem
      > = {}

      for (const o of orders) {
        const rawName = (o.customerName || o.user?.name || 'Tamu').trim()
        if (!rawName || rawName.toLowerCase().startsWith('tester')) continue

        if (!customerStats[rawName]) {
          customerStats[rawName] = {
            name: rawName,
            orderCount: 0,
            completedCount: 0,
            paidCount: 0,
            totalSpent: 0,
          }
        }
        customerStats[rawName].orderCount += 1
        if (o.orderStatus === 'SELESAI') {
          customerStats[rawName].completedCount += 1
        }
        if (o.paymentStatus === 'PAID') {
          customerStats[rawName].paidCount += 1
          customerStats[rawName].totalSpent += o.totalAmount
        }
      }

      const customerList = Object.values(customerStats)

      const topByOrderCount = [...customerList]
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limit)

      const topBySpending = [...customerList]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit)

      return {
        allowed: true,
        data: {
          topByOrderCount,
          topBySpending,
          totalCustomersRecorded: customerList.length,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying top customers:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query data pelanggan di database.',
      }
    }
  })
}

/**
 * 4. Pesanan Hari Ini (WIB) - Kasir & Admin
 */
export async function getTodayOrdersData(role: UserRoleType): Promise<ServiceResult<TodayOrdersData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const { startWib, endWib, dateString } = getWibTodayRange()

      const orders = await db.order.findMany({
        where: {
          createdAt: {
            gte: startWib,
            lte: endWib,
          },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { name: true } },
          items: {
            select: {
              quantity: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const totalOrders = orders.length
      const menunggu = orders.filter((o) => o.orderStatus === 'MENUNGGU').length
      const diproses = orders.filter((o) => o.orderStatus === 'DIPROSES').length
      const siap = orders.filter((o) => o.orderStatus === 'SIAP').length
      const selesai = orders.filter((o) => o.orderStatus === 'SELESAI').length
      const dibatalkan = orders.filter((o) => o.orderStatus === 'DIBATALKAN').length

      const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID')
      const totalPaidAmount = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

      const customerNames = Array.from(
        new Set(orders.map((o) => (o.customerName || o.user?.name || 'Tamu')).filter(Boolean))
      )

      return {
        allowed: true,
        data: {
          dateString,
          totalOrders,
          menunggu,
          diproses,
          siap,
          selesai,
          dibatalkan,
          paidCount: paidOrders.length,
          totalPaidAmount,
          customerNames,
          recentOrders: orders.slice(0, 5).map((o) => ({
            orderNumber: o.orderNumber,
            customerName: o.customerName || o.user?.name || 'Tamu',
            status: o.orderStatus,
            payment: o.paymentStatus,
            total: o.totalAmount,
            itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
          })),
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying today orders:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query pesanan hari ini di database.',
      }
    }
  })
}

/**
 * 5. Pesanan yang Masih Menunggu / Antrean Aktif
 */
export async function getWaitingPendingOrdersData(role: UserRoleType, limit = 10): Promise<ServiceResult<WaitingOrdersData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const orders = await db.order.findMany({
        where: {
          orderNumber: { not: { startsWith: 'TEST-' } },
          OR: [
            { orderStatus: { in: ['MENUNGGU', 'DIPROSES', 'SIAP'] } },
            { paymentStatus: 'PENDING', orderStatus: { not: 'DIBATALKAN' } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
          user: { select: { name: true } },
        },
      })

      const formatted = orders.map((o) => {
        const itemsDesc = o.items
          .map((it) => `${it.quantity}x ${it.product.name}`)
          .join(', ')
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName || o.user?.name || 'Tamu',
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          totalAmount: o.totalAmount,
          itemsSummary: itemsDesc || 'Tidak ada item',
          createdAt: o.createdAt.toISOString(),
        }
      })

      return {
        allowed: true,
        data: {
          count: orders.length,
          orders: formatted,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying waiting orders:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query pesanan menunggu di database.',
      }
    }
  })
}

/**
 * 6. Menu Paling Laris / Terpopuler
 */
export async function getTopSellingMenuData(role: UserRoleType, limit = 5): Promise<ServiceResult<TopSellingMenuData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const orderItems = await db.orderItem.findMany({
        where: {
          order: {
            orderStatus: { not: 'DIBATALKAN' },
            orderNumber: { not: { startsWith: 'TEST-' } },
          },
        },
        include: {
          product: {
            include: {
              category: { select: { name: true } },
            },
          },
        },
      })

      const productMap: Record<
        string,
        TopProductItem
      > = {}

      for (const item of orderItems) {
        const name = item.product?.name || 'Menu'
        const category = item.product?.category?.name || 'Lainnya'
        const price = item.price || item.product?.price || 0
        if (!productMap[name]) {
          productMap[name] = {
            name,
            category,
            price,
            totalQuantity: 0,
            totalRevenue: 0,
          }
        }
        productMap[name].totalQuantity += item.quantity
        productMap[name].totalRevenue += item.subtotal || item.quantity * price
      }

      const sorted = Object.values(productMap)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, limit)

      return {
        allowed: true,
        data: {
          topProducts: sorted,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying top selling menu:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query menu terlaris di database.',
      }
    }
  })
}

/**
 * 6B. Daftar Menu Tersedia & Harga
 */
export async function getAvailableMenuData(role: UserRoleType): Promise<ServiceResult<{ categories: { name: string; items: { name: string; price: number }[] }[] }>> {
  return withRetry(async () => {
    try {
      const categories = await db.category.findMany({
        include: {
          products: {
            where: { isAvailable: true },
            select: { name: true, price: true },
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })

      const formatted = categories
        .filter((c) => c.products.length > 0)
        .map((c) => ({
          name: c.name,
          items: c.products.map((p) => ({ name: p.name, price: p.price })),
        }))

      return {
        allowed: true,
        data: { categories: formatted },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying available menu:', err)
      return { allowed: true, error: 'Gagal melakukan query menu di database.' }
    }
  })
}

/**
 * 7. Total Penjualan Bulan Ini (WIB)
 */
export async function getMonthlySalesData(role: UserRoleType): Promise<ServiceResult<MonthlySalesData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const { startWib, endWib, monthString } = getWibMonthRange()

      const paidAggregation = await db.order.aggregate({
        where: {
          createdAt: {
            gte: startWib,
            lte: endWib,
          },
          paymentStatus: 'PAID',
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      })

      const totalOrdersCount = await db.order.count({
        where: {
          createdAt: {
            gte: startWib,
            lte: endWib,
          },
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
      })

      const totalAmount = paidAggregation._sum.totalAmount || 0
      const paidCount = paidAggregation._count.id || 0
      const avgPerOrder = paidCount > 0 ? Math.round(totalAmount / paidCount) : 0

      return {
        allowed: true,
        data: {
          monthString,
          totalSalesPaid: totalAmount,
          paidOrdersCount: paidCount,
          totalOrdersCount,
          averagePerOrder: avgPerOrder,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying monthly sales:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan query penjualan bulanan di database.',
      }
    }
  })
}

/**
 * 8. Ringkasan Pesanan Pelanggan Tertentu
 */
export async function searchCustomerOrdersData(
  role: UserRoleType,
  customerNameQuery: string,
  limit = 5
): Promise<ServiceResult<CustomerOrderSummaryData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses terbatas untuk staf (Admin / Kasir).',
    }
  }

  const cleanQuery = customerNameQuery.trim()
  if (!cleanQuery) {
    return {
      allowed: true,
      data: null,
      message: 'Nama pelanggan pencarian tidak boleh kosong.',
    }
  }

  return withRetry(async () => {
    try {
      const orders = await db.order.findMany({
        where: {
          orderNumber: { not: { startsWith: 'TEST-' } },
          OR: [
            { customerName: { contains: cleanQuery, mode: 'insensitive' } },
            { user: { name: { contains: cleanQuery, mode: 'insensitive' } } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              product: { select: { name: true } },
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      })

      if (orders.length === 0) {
        return {
          allowed: true,
          data: null,
          message: `Tidak ditemukan pesanan dengan nama pelanggan yang cocok dengan "${cleanQuery}".`,
        }
      }

      const totalSpentPaid = orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0)

      const list = orders.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.user?.name || 'Tamu',
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        items: o.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', '),
        createdAt: o.createdAt.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))

      return {
        allowed: true,
        data: {
          query: cleanQuery,
          totalFound: orders.length,
          totalSpentPaid,
          orders: list,
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error searching customer orders:', err)
      return {
        allowed: true,
        error: 'Gagal melakukan pencarian pesanan pelanggan di database.',
      }
    }
  })
}

/**
 * 9. Master Data Pelanggan Terdaftar (Role PELANGGAN) - Khusus Admin
 */
export interface RegisteredCustomersData {
  totalCount: number
  customers: {
    id: string
    name: string
    email: string
    createdAt: string
  }[]
}

export async function getRegisteredCustomersData(
  role: UserRoleType
): Promise<ServiceResult<RegisteredCustomersData>> {
  if (role !== 'ADMIN') {
    return {
      allowed: false,
      message: 'Akses data master pelanggan terdaftar khusus untuk Administrator.',
    }
  }

  return withRetry(async () => {
    try {
      const users = await db.user.findMany({
        where: { role: 'PELANGGAN' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return {
        allowed: true,
        data: {
          totalCount: users.length,
          customers: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          })),
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying registered customers:', err)
      return {
        allowed: true,
        error: 'Gagal mengambil data pelanggan dari database.',
      }
    }
  })
}

/**
 * 10. Riwayat Transaksi Terbaru - Kasir & Admin
 */
export interface RecentOrdersData {
  totalFound: number
  orders: {
    orderNumber: string
    customerName: string
    totalAmount: number
    orderStatus: string
    paymentStatus: string
    createdAt: string
  }[]
}

export async function getRecentOrdersData(
  role: UserRoleType,
  limit = 5
): Promise<ServiceResult<RecentOrdersData>> {
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      allowed: false,
      message: 'Akses riwayat transaksi hanya untuk Staf (Admin & Kasir).',
    }
  }

  return withRetry(async () => {
    try {
      const orders = await db.order.findMany({
        where: {
          orderNumber: { not: { startsWith: 'TEST-' } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      })

      return {
        allowed: true,
        data: {
          totalFound: orders.length,
          orders: orders.map((o) => ({
            orderNumber: o.orderNumber,
            customerName: (o.customerName || o.user?.name || 'Pelanggan').trim(),
            totalAmount: o.totalAmount,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            createdAt: o.createdAt.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          })),
        },
      }
    } catch (err: unknown) {
      console.error('[AI Data Service] Error querying recent orders:', err)
      return {
        allowed: true,
        error: 'Gagal mengambil riwayat transaksi dari database.',
      }
    }
  })
}

export interface QueryResolutionResult {
  intent: string
  primaryDataText: string
  specificInstructions: string
  isGeneralSummaryNeeded: boolean
}

/**
 * 11. Resolusi Data Otomatis & Cerdas Berdasarkan Pertanyaan Pengguna, Role, dan Halaman Aktif
 * Mengambil HANYA data database aktual yang relevan sesuai pertanyaan, tanpa mencampurkan data yang tidak ditanyakan.
 */
export async function resolveAiContextData(
  prompt: string,
  role: UserRoleType,
  currentPath?: string
): Promise<QueryResolutionResult> {
  const clean = prompt.toLowerCase().trim()
  const path = (currentPath || '').toLowerCase().trim()

  // Default fallback jika role bukan staf
  if (role !== 'ADMIN' && role !== 'KASIR') {
    return {
      intent: 'NONE',
      primaryDataText: '',
      specificInstructions: 'Jawab pertanyaan seputar menu makanan, harga, dan cara pemesanan UMKM Ojolali.',
      isGeneralSummaryNeeded: false,
    }
  }

  // A. Pertanyaan Jumlah / Total Pelanggan Terdaftar
  const totalCustomersPattern =
    /\b(berapa\s+(total|semua|jumlah)\s+pelanggan|total\s+pelanggan|jumlah\s+pelanggan|ada\s+berapa\s+pelanggan|berapa\s+banyak\s+pelanggan|hitung\s+pelanggan)\b/i
  const isAmbiguousCustomerCount =
    /\b(berapa\s+totalnya|ada\s+berapa|berapa\s+jumlahnya|berapa\s+banyak)\b/i.test(clean) &&
    path.includes('/pelanggan')

  if (totalCustomersPattern.test(clean) || isAmbiguousCustomerCount) {
    if (role === 'ADMIN') {
      const res = await getRegisteredCustomersData('ADMIN')
      const count = res.data?.totalCount || 0
      return {
        intent: 'TOTAL_CUSTOMERS_COUNT',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - JUMLAH PELANGGAN TERDAFTAR]\nTotal pelanggan terdaftar di sistem saat ini: ${count} pelanggan.`,
        specificInstructions: `ATURAN JAWABAN WAJIB (SANGAT PENTING):
- Jawab pertanyaan secara langsung, singkat, dan padat.
- Berikan jawaban: "Saat ini terdapat ${count} pelanggan yang terdaftar di sistem."
- DILARANG KERAS menambahkan informasi lain seperti pesanan menunggu, total omzet, riwayat transaksi, atau pembeli terbanyak karena pengguna HANYA menanyakan total pelanggan!`,
        isGeneralSummaryNeeded: false,
      }
    } else {
      return {
        intent: 'KASIR_CUSTOMER_RBAC',
        primaryDataText: `[BATASAN HAK AKSES ROLE KASIR]\nData master akun pelanggan terdaftar dikelola oleh Administrator pada halaman Admin > Data Pelanggan. Kasir mengelola antrean pesanan kasir dan riwayat transaksi.`,
        specificInstructions: `Jelaskan secara ramah dan sopan bahwa informasi rekapitulasi data akun pelanggan terdaftar merupakan wewenang Administrator pada menu Admin > Data Pelanggan. Sebagai asisten kasir, Anda siap membantu dengan data antrean pesanan menunggu, transaksi selesai, dan omzet riwayat kasir.`,
        isGeneralSummaryNeeded: false,
      }
    }
  }

  // B1. Pertanyaan Daftar Pelanggan yang Sering Membeli ("siapa aja pelanggan yang sering beli?", "siapa saja pelanggan yang sering beli?", "daftar pelanggan yang sering beli", "pelanggan yang sering beli", dsb.)
  const frequentCustomersListPattern =
    /\b(siapa\s+(aja|saja)\s+(pelanggan\s+)?(yang\s+)?sering\s+(mem)?(beli|order|pesan|belanja)|daftar\s+pelanggan\s+(yang\s+)?sering\s+(mem)?(beli|order|pesan|belanja)|pelanggan\s+(yang\s+)?sering\s+(mem)?(beli|order|pesan|belanja)|siapa\s+pelanggan\s+(yang\s+)?sering\s+(mem)?(beli|order|pesan)|siapa\s+(aja|saja|yang)?\s*(yang\s+)?sering\s+(mem)?(beli|order))\b/i

  if (frequentCustomersListPattern.test(clean) && !clean.includes('paling')) {
    const res = await getTopCustomersData(role, 5)
    const topList = res.data?.topByOrderCount || []
    const listStr = topList
      .map((c, idx) => `${idx + 1}. ${c.name} — ${c.orderCount} pesanan (${c.completedCount} pesanan SELESAI)`)
      .join('\n')

    return {
      intent: 'FREQUENT_CUSTOMERS_LIST',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - DAFTAR PELANGGAN YANG SERING MEMBELI]
Peringkat pelanggan yang sering membeli berdasarkan jumlah transaksi pesanan di database:
${listStr}

Metrik perhitungan: Dihitung berdasarkan total akumulasi frekuensi pesanan yang dibuat oleh pelanggan di sistem.`,
      specificInstructions: `ATURAN JAWABAN WAJIB:
- Jawab secara langsung daftar pelanggan yang sering membeli berdasarkan data aktual di atas:
"Berikut pelanggan yang sering membeli di UMKM Baso & Mie Ayam Ojolali:
${listStr}"
- Jelaskan metrik perhitungannya secara ringkas (dihitung berdasarkan jumlah akumulasi transaksi pesanan pelanggan di database).
- DILARANG menambahkan informasi lain yang tidak diminta seperti omzet toko, saldo, atau pesanan menunggu!`,
      isGeneralSummaryNeeded: false,
    }
  }

  // B2. Pertanyaan Siapa Pelanggan yang Paling Sering Membeli (Top 1) ("siapa yang paling sering beli", "paling sering beli", "siapa pembeli terbanyak")
  const topFreqCustomerPattern =
    /\b(siapa\s+(yang\s+)?paling\s+sering\s+(mem)?beli|paling\s+sering\s+(mem)?beli|pembeli\s+paling\s+sering|siapa\s+pelanggan\s+yang\s+paling\s+sering|frekuensi\s+pesanan\s+terbanyak|paling\s+banyak\s+memesan|paling\s+sering\s+order|pembeli\s+paling\s+rajin|siapa\s+(yang\s+)?paling\s+rajin\s+beli|pembeli\s+terbanyak|pelanggan\s+terbanyak)\b/i

  if (topFreqCustomerPattern.test(clean)) {
    const res = await getTopCustomersData(role, 5)
    const topList = res.data?.topByOrderCount || []
    const top1 = topList[0]
    const listStr = topList
      .map((c, idx) => `${idx + 1}. ${c.name} — ${c.orderCount} pesanan total (${c.completedCount} pesanan SELESAI)`)
      .join('\n')

    return {
      intent: 'TOP_CUSTOMERS_MOST_ORDERS',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - PELANGGAN PALING SERING MEMBELI]\nPelanggan dengan frekuensi pesanan terbanyak:\n${listStr}\nMetrik perhitungan: Dihitung berdasarkan frekuensi/jumlah akumulasi pesanan yang dibuat pelanggan di sistem.`,
      specificInstructions: `ATURAN JAWABAN WAJIB:
- Jawab pertanyaan secara langsung: Sebutkan bahwa pelanggan yang paling sering membeli adalah ${top1?.name || 'vikri'} dengan total ${top1?.orderCount || 0} pesanan (di mana ${top1?.completedCount || 0} di antaranya berstatus selesai).
- Jelaskan metrik perhitungannya: Metrik dihitung berdasarkan jumlah pesanan yang tercatat di sistem.
- DILARANG menambahkan informasi omzet toko atau pesanan menunggu jika tidak ditanyakan.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // C. Pertanyaan Pelanggan yang Paling Banyak Belanja (Nominal Rupiah Belanja Tertinggi)
  const topSpendCustomerPattern =
    /\b(paling\s+banyak\s+belanja|belanja\s+paling\s+banyak|siapa\s+yang\s+paling\s+banyak\s+belanja|paling\s+banyak\s+habiskan\s+uang|nominal\s+belanja\s+terbanyak|total\s+belanja\s+tertinggi|belanjaan\s+terbanyak|pembeli\s+terbanyak)\b/i

  if (topSpendCustomerPattern.test(clean)) {
    const res = await getTopCustomersData(role, 5)
    const topList = res.data?.topBySpending || []
    const top1 = topList[0]
    const listStr = topList
      .map((c, idx) => `${idx + 1}. ${c.name} — Total belanja Rp${c.totalSpent.toLocaleString('id-ID')} (${c.paidCount} transaksi lunas)`)
      .join('\n')

    return {
      intent: 'TOP_CUSTOMERS_MOST_SPENDING',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - PELANGGAN PALING BANYAK BELANJA]\nPelanggan dengan nominal belanja tertinggi:\n${listStr}\nMetrik perhitungan: Dihitung berdasarkan akumulasi nominal rupiah transaksi belanja berstatus lunas (PAID).`,
      specificInstructions: `ATURAN JAWABAN WAJIB:
- Jawab pertanyaan secara langsung: Sebutkan bahwa pelanggan yang paling banyak belanja adalah ${top1?.name || 'sofi'} dengan total belanja sebesar Rp${(top1?.totalSpent || 0).toLocaleString('id-ID')}.
- Jelaskan metrik perhitungannya: Metrik dihitung berdasarkan total akumulasi transaksi belanja berstatus lunas (PAID).
- DILARANG menambahkan data lain yang tidak ditanyakan.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // D. Pertanyaan Daftar Nama Pelanggan Terdaftar ("Siapa aja yang terdaftar?", "Daftar pelanggan", dsb.)
  const customerListPattern =
    /\b(siapa\s+(saja|aja|yang)?\s*(yang\s+)?(sudah\s+)?(terdaftar|daftar)|siapa\s+(saja|aja)\s+pelanggan|daftar\s+pelanggan|list\s+pelanggan|nama(\s+nama)?\s+pelanggan(\s+terdaftar)?|tampilkan\s+(semua\s+)?pelanggan|pelanggan\s+terdaftar)\b/i
  const isAmbiguousCustomerList =
    /\b(siapa\s+(saja|aja)|tampilkan\s+daftarnya|tampilkan\s+semua)\b/i.test(clean) &&
    path.includes('/pelanggan')

  if ((customerListPattern.test(clean) || isAmbiguousCustomerList) && !clean.includes('sering') && !clean.includes('banyak') && !clean.includes('belanja') && !clean.includes('beli') && !clean.includes('menunggu')) {
    if (role === 'ADMIN') {
      const res = await getRegisteredCustomersData('ADMIN')
      const customers = res.data?.customers || []
      const customerNames = customers.map((c) => `• ${c.name}`).join('\n')
      return {
        intent: 'REGISTERED_CUSTOMERS_LIST',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - DAFTAR PELANGGAN TERDAFTAR (${customers.length} PELANGGAN)]
Berikut pelanggan yang terdaftar saat ini:
${customerNames}`,
        specificInstructions: `ATURAN JAWABAN WAJIB (SANGAT KETAT):
- Jawab HANYA daftar nama pelanggan di atas secara langsung dan ringkas.
- Format jawaban:
"Berikut pelanggan yang terdaftar saat ini:
${customerNames}"
- DILARANG KERAS menambahkan informasi lain seperti pesanan menunggu, analisis transaksi, total omzet, pembeli terbanyak, atau riwayat transaksi! Jawab HANYA daftar nama pelanggan saja.`,
        isGeneralSummaryNeeded: false,
      }
    } else {
      return {
        intent: 'KASIR_CUSTOMER_RBAC',
        primaryDataText: `[BATASAN HAK AKSES ROLE KASIR]\nDaftar master akun pelanggan terdaftar hanya dapat diakses oleh Administrator pada Admin Panel.`,
        specificInstructions: `Jelaskan bahwa daftar master akun pelanggan terdaftar merupakan wewenang Administrator pada menu Admin > Data Pelanggan.`,
        isGeneralSummaryNeeded: false,
      }
    }
  }

  // E. Pertanyaan Siapa Pelanggan yang Memiliki Pesanan Menunggu ("Siapa yang punya pesanan menunggu?")
  const waitingCustomersPattern =
    /\b(siapa\s+(yang\s+)?(punya|memiliki|ada)\s+pesanan\s+menunggu|pelanggan\s+(yang\s+)?(punya|memiliki|ada)\s+pesanan\s+menunggu|siapa\s+(saja|aja)\s+yang\s+menunggu|siapa\s+yang\s+pesanan(nya)?\s+menunggu)\b/i

  if (waitingCustomersPattern.test(clean)) {
    const res = await getWaitingPendingOrdersData(role, 20)
    const orders = res.data?.orders?.filter((o) => o.orderStatus === 'MENUNGGU') || []
    if (orders.length === 0) {
      return {
        intent: 'WAITING_CUSTOMERS_LIST',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - PELANGGAN DENGAN PESANAN MENUNGGU]\nSaat ini tidak ada pelanggan yang memiliki pesanan berstatus MENUNGGU.`,
        specificInstructions: `Jawab secara langsung dan ringkas bahwa saat ini tidak ada antrean pesanan berstatus MENUNGGU. DILARANG menambahkan data lain yang tidak diminta.`,
        isGeneralSummaryNeeded: false,
      }
    }

    const uniqueCustomers = Array.from(new Set(orders.map((o) => o.customerName)))
    const listStr = orders.map((o) => `• ${o.customerName} (Pesanan #${o.orderNumber} - Rp${o.totalAmount.toLocaleString('id-ID')})`).join('\n')

    return {
      intent: 'WAITING_CUSTOMERS_LIST',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - PELANGGAN DENGAN PESANAN MENUNGGU]
Pelanggan yang memiliki pesanan berstatus MENUNGGU saat ini:
${uniqueCustomers.map((n) => `• ${n}`).join('\n')}

Rincian antrean:
${listStr}`,
      specificInstructions: `ATURAN JAWABAN WAJIB:
- Jawab secara langsung siapa saja pelanggan yang memiliki pesanan berstatus MENUNGGU: ${uniqueCustomers.join(', ')}.
- Sebutkan rincian nomor pesanan secara ringkas.
- DILARANG menambahkan rekapitulasi omzet atau transaksi selesai jika tidak ditanyakan.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // F. Pertanyaan Jumlah Pesanan yang Menunggu ("Berapa pesanan yang menunggu?")
  const waitingPattern =
    /\b(berapa\s+pesanan\s+(yang\s+)?menunggu|pesanan\s+menunggu|antrean\s+menunggu|antrian\s+menunggu|pesanan\s+pending|masih\s+menunggu|belum\s+diproses|antrean\s+kasir)\b/i
  const isAmbiguousWaiting =
    /\b(berapa\s+totalnya|ada\s+berapa|berapa\s+pesanan)\b/i.test(clean) &&
    (path.includes('/pesanan') || path.includes('/transaksi'))

  if (waitingPattern.test(clean) || isAmbiguousWaiting) {
    const res = await getWaitingPendingOrdersData(role, 10)
    const count = res.data?.count || 0
    const listStr = res.data?.orders?.length
      ? res.data.orders.map((o) => `- #${o.orderNumber} | Pelanggan: ${o.customerName} | Rp${o.totalAmount.toLocaleString('id-ID')} | Menu: ${o.itemsSummary}`).join('\n')
      : 'Saat ini tidak ada antrean pesanan menunggu.'

    return {
      intent: 'WAITING_ORDERS',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - PESANAN MENUNGGU]\nJumlah pesanan berstatus MENUNGGU saat ini: ${count} pesanan.\nRincian antrean:\n${listStr}`,
      specificInstructions: `ATURAN JAWABAN:
- Jawab secara langsung jumlah pesanan berstatus MENUNGGU saat ini (${count} pesanan).
- Sebutkan rincian nomor pesanan dan nama pelanggan secara ringkas.
- JANGAN menambahkan rekapitulasi omzet atau transaksi selesai jika tidak ditanyakan.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // F. Pertanyaan Total Transaksi Selesai
  const completedPattern =
    /\b(berapa\s+(semua\s+)?(total\s+)?transaksi\s+(yang\s+)?selesai|total\s+transaksi\s+selesai|transaksi\s+selesai|semua\s+transaksi\s+selesai|berapa\s+transaksi\s+selesai|transaksi\s+lunas)\b/i

  if (completedPattern.test(clean)) {
    const res = await getTransactionHistorySummaryData(role)
    const d = res.data
    const totalCount = d?.totalTransaksiSelesai || 0
    const totalOmzet = d?.totalOmzetRiwayat || 0

    return {
      intent: 'COMPLETED_TRANSACTIONS',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - TOTAL TRANSAKSI SELESAI]\nTotal transaksi berstatus SELESAI: ${totalCount} pesanan.\nTotal omzet riwayat transaksi selesai: Rp${totalOmzet.toLocaleString('id-ID')}.\nData ini konsisten dengan ringkasan Halaman Riwayat Transaksi Kasir.`,
      specificInstructions: `ATURAN JAWABAN:
- Jawab pertanyaan secara langsung: "Saat ini terdapat ${totalCount} transaksi yang telah selesai, dengan total omzet riwayat sebesar Rp${totalOmzet.toLocaleString('id-ID')}."
- Sebutkan bahwa data ini sesuai dengan halaman Riwayat Transaksi Kasir.
- JANGAN mengatakan bahwa Anda hanya punya akses data hari ini!`,
      isGeneralSummaryNeeded: false,
    }
  }

  // G. Pertanyaan Total Omzet / Pendapatan Toko ("berapa omzet toko?", "berapa omzet?")
  const revenuePattern =
    /\b(berapa\s+(total\s+)?(omzet|omset)(\s+toko)?|total\s+(omzet|omset)(\s+toko)?|omzet\s+toko|omset\s+toko|berapa\s+(total\s+)?pendapatan(\s+toko)?|total\s+pendapatan|omzet\s+riwayat|omset\s+riwayat|omzet\s+keseluruhan|omset\s+keseluruhan|akumulasi\s+omzet|akumulasi\s+omset)\b/i

  if (revenuePattern.test(clean)) {
    const res = await getTransactionHistorySummaryData(role)
    const totalOmzet = res.data?.totalOmzetRiwayat || 0
    const totalCompleted = res.data?.totalTransaksiSelesai || 0

    return {
      intent: 'TOTAL_OMZET',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - TOTAL OMZET RIWAYAT]\nTotal omzet riwayat transaksi: Rp${totalOmzet.toLocaleString('id-ID')} (berasal dari ${totalCompleted} transaksi berstatus SELESAI).`,
      specificInstructions: `ATURAN JAWABAN:
- Jawab secara langsung bahwa total omzet riwayat toko adalah sebesar Rp${totalOmzet.toLocaleString('id-ID')} dari ${totalCompleted} transaksi selesai.
- Jawab singkat dan padat tanpa menambahkan daftar pesanan menunggu.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // H. Pertanyaan Menu Paling Laris / Terpopuler
  const topSellingPattern =
    /\b(menu\s+apa\s+yang\s+paling\s+(laris|banyak\s+dipesan)|menu\s+(paling\s+)?laris|menu\s+terlaris|makanan\s+terlaris|menu\s+populer|paling\s+banyak\s+dipesan|produk\s+terlaris)\b/i
  const isAmbiguousMenu =
    /\b(yang\s+paling\s+laris|mana\s+yang\s+laris)\b/i.test(clean) &&
    (path.includes('/menu') || path.includes('/kategori'))

  if (topSellingPattern.test(clean) || isAmbiguousMenu) {
    const res = await getTopSellingMenuData(role, 5)
    const topList = res.data?.topProducts || []
    const top1 = topList[0]
    const listStr = topList
      .map((p, idx) => `${idx + 1}. ${p.name} (${p.category}) — ${p.totalQuantity} porsi terjual (Total omzet: Rp${p.totalRevenue.toLocaleString('id-ID')})`)
      .join('\n')

    return {
      intent: 'TOP_SELLING_MENU',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - MENU PALING LARIS]\nMenu terlaris berdasarkan pesanan pelanggan:\n${listStr}\nMetrik perhitungan: Dihitung berdasarkan akumulasi porsi (quantity) dari pesanan pelanggan yang tercatat di database.`,
      specificInstructions: `ATURAN JAWABAN:
- Sebutkan bahwa menu yang paling laris adalah ${top1?.name || 'Bakso Daging'} dengan ${top1?.totalQuantity || 0} porsi terjual.
- Jelaskan metrik perhitungannya: Dihitung berdasarkan total akumulasi porsi dari pesanan pelanggan di database.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // H2. Pertanyaan Daftar Menu / Harga Menu Tersedia ("daftar menu", "harga menu", "menu apa saja", dsb.)
  const menuListPattern =
    /\b(daftar\s+menu|list\s+menu|harga\s+menu|menu\s+apa\s+saja|ada\s+menu\s+apa|menu\s+tersedia|pilihan\s+menu|daftar\s+harga)\b/i

  if (menuListPattern.test(clean) && !clean.includes('laris') && !clean.includes('populer')) {
    const res = await getAvailableMenuData(role)
    const cats = res.data?.categories || []
    const formattedCats = cats
      .map((c) => `• Kategori ${c.name}:\n` + c.items.map((it) => `  - ${it.name}: Rp${it.price.toLocaleString('id-ID')}`).join('\n'))
      .join('\n\n')

    return {
      intent: 'AVAILABLE_MENU_LIST',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - DAFTAR MENU TERSEDIA]\n${formattedCats}`,
      specificInstructions: `ATURAN JAWABAN:
- Tampilkan ringkasan menu yang tersedia per kategori beserta harganya.
- Jawab secara rapi dan ringkas. DILARANG menambahkan data transaksi atau omzet jika tidak ditanyakan.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // I. Pertanyaan Berdasarkan Tanggal Tertentu (Eksplisit atau Relatif)
  const dateInfo = parseDateFromQuery(prompt)
  if (dateInfo) {
    const res = await getOrdersByDateData(role, dateInfo)
    const d = res.data
    if (!d || d.totalOrders === 0) {
      return {
        intent: 'TRANSACTIONS_BY_DATE',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - TRANSAKSI TANGGAL ${dateInfo.label}]\nPada tanggal ${dateInfo.label}, tidak ada transaksi yang tercatat di database (Total pesanan: 0, omzet: Rp0).`,
        specificInstructions: `Jelaskan bahwa pada tanggal ${dateInfo.label} tidak terdapat transaksi yang tercatat di database. JANGAN mengatakan Anda tidak punya akses data historis.`,
        isGeneralSummaryNeeded: false,
      }
    } else {
      return {
        intent: 'TRANSACTIONS_BY_DATE',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - TRANSAKSI TANGGAL ${d.label}]\n- Tanggal: ${d.label}\n- Total Transaksi Masuk: ${d.totalOrders} pesanan\n- Rincian Status: Selesai (${d.selesaiCount}), Menunggu (${d.menungguCount})\n- Transaksi Lunas (PAID): ${d.paidCount} pesanan\n- Total Omzet Lunas: Rp${d.totalOmzetPaid.toLocaleString('id-ID')}\n- Rincian Pesanan:\n${d.orderDetails.join('\n')}`,
        specificInstructions: `Jelaskan angka transaksi dan total omzet untuk tanggal ${d.label} ini secara spesifik sesuai data aktual di atas. JANGAN PERNAH menyatakan bahwa data tidak tersedia atau Anda hanya punya data hari ini!`,
        isGeneralSummaryNeeded: false,
      }
    }
  }

  // J. Pertanyaan Riwayat Transaksi Terbaru
  const recentOrdersPattern =
    /\b(tampilkan\s+riwayat\s+transaksi(\s+terbaru|\s+terakhir)?|riwayat\s+transaksi\s+terbaru|transaksi\s+terbaru|daftar\s+transaksi\s+terakhir)\b/i

  if (recentOrdersPattern.test(clean)) {
    const res = await getRecentOrdersData(role, 5)
    const orders = res.data?.orders || []
    const listStr = orders.length
      ? orders.map((o, idx) => `${idx + 1}. #${o.orderNumber} (${o.createdAt}) — ${o.customerName} | Status: ${o.orderStatus} | Bayar: ${o.paymentStatus} | Rp${o.totalAmount.toLocaleString('id-ID')}`).join('\n')
      : 'Belum ada transaksi di database.'

    return {
      intent: 'RECENT_TRANSACTIONS',
      primaryDataText: `[HASIL QUERY DATABASE NYATA - RIWAYAT TRANSAKSI TERBARU (5 TRANSAKSI TERAKHIR)]\n${listStr}`,
      specificInstructions: `Tampilkan riwayat 5 transaksi terbaru secara rapi dan ringkas. Jawab langsung tanpa menambahkan data yang tidak diminta.`,
      isGeneralSummaryNeeded: false,
    }
  }

  // K. Pertanyaan Pesanan Hari Ini / Omzet Hari Ini
  const todayPattern =
    /\b(pesanan\s+hari\s+ini|order\s+hari\s+ini|transaksi\s+hari\s+ini|penjualan\s+hari\s+ini|omzet\s+hari\s+ini|omset\s+hari\s+ini)\b/i

  if (todayPattern.test(clean)) {
    const res = await getTodayOrdersData(role)
    const d = res.data
    if (d) {
      return {
        intent: 'TODAY_ORDERS',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - PESANAN HARI INI (${d.dateString} WIB)]\n- Total Pesanan Masuk Hari Ini: ${d.totalOrders} pesanan\n- Selesai: ${d.selesai}, Menunggu: ${d.menunggu}, Diproses: ${d.diproses}\n- Transaksi Lunas: ${d.paidCount} pesanan\n- Total Omzet Lunas Hari Ini: Rp${d.totalPaidAmount.toLocaleString('id-ID')}`,
        specificInstructions: `Jawab transaksi dan omzet hari ini secara spesifik sesuai data di atas.`,
        isGeneralSummaryNeeded: false,
      }
    }
  }

  // L. Pertanyaan Pesanan Spesifik Berdasarkan Nama Pelanggan
  const customerSummaryPattern =
    /\b(ringkasan\s+pesanan\s+pelanggan|pesanan\s+pelanggan|cek\s+pesanan|pelanggan\s+bernama|pesanan\s+atas\s+nama)\s+([a-zA-Z0-9\s]{2,30})/i
  const custMatch = clean.match(customerSummaryPattern)
  if (custMatch && custMatch[2]) {
    const targetName = custMatch[2].trim()
    const res = await searchCustomerOrdersData(role, targetName)
    if (res.data && res.data.orders.length > 0) {
      const ordersStr = res.data.orders
        .map((o) => `- #${o.orderNumber} (${o.createdAt}): Status ${o.orderStatus}, Bayar ${o.paymentStatus}, Rp${o.totalAmount.toLocaleString('id-ID')} [${o.items}]`)
        .join('\n')
      return {
        intent: 'CUSTOMER_ORDERS_SEARCH',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - PESANAN PELANGGAN "${res.data.query}"]\nTotal Pesanan Ditemukan: ${res.data.totalFound}\n${res.data.totalSpentPaid !== undefined ? `Total Belanja Lunas: Rp${res.data.totalSpentPaid.toLocaleString('id-ID')}\n` : ''}Daftar Pesanan:\n${ordersStr}`,
        specificInstructions: `Sebutkan riwayat pesanan pelanggan ${res.data.query} secara spesifik.`,
        isGeneralSummaryNeeded: false,
      }
    }
  }

  // M. Pertanyaan Ringkasan Menyeluruh (Overview / Performa Toko)
  const overviewPattern =
    /\b(ringkasan\s+(toko|operasional|administrasi)|bagaimana\s+performa\s+toko|laporan\s+lengkap|overview|rekap\s+keseluruhan|performa\s+toko)\b/i

  if (overviewPattern.test(clean)) {
    const op = await getOperationalSummary(role)
    if (op) {
      return {
        intent: 'GENERAL_SUMMARY',
        primaryDataText: `[HASIL QUERY DATABASE NYATA - RINGKASAN TOKO]\n• Total Pendapatan Toko: Rp${op.totalOmzetRiwayat.toLocaleString('id-ID')}\n• Total Keseluruhan Pesanan: ${op.totalPesananSemua} pesanan\n• Total Transaksi Selesai: ${op.totalTransaksiSelesai} pesanan\n• Total Pesanan Menunggu: ${op.pesananMenunggu} pesanan\n• Total Pelanggan Terdaftar: ${op.totalPelangganUser} pelanggan\n• Total Menu Aktif: ${op.totalMenuProduk} menu`,
        specificInstructions: `Berikan ringkasan performa toko secara komprehensif berdasarkan data aktual di atas.`,
        isGeneralSummaryNeeded: true,
      }
    }
  }

  // N. Default: Jika tidak cocok dengan pola spesifik di atas
  return {
    intent: 'GENERAL_QUERY',
    primaryDataText: '',
    specificInstructions: `Jawab pertanyaan pengguna secara sopan, akurat, dan sesuai dengan wewenang role Anda. Jawab langsung tanpa mengarang data.`,
    isGeneralSummaryNeeded: false,
  }
}
