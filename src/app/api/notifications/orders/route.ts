import { NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getStaffSession()

    // Hanya role ADMIN dan KASIR yang berhak mengakses API notifikasi pesanan staf
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'KASIR')) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya staf yang diizinkan.' }, { status: 403 })
    }

    // Ambil 15 pesanan terbaru
    // Hanya memuat data ringkasan pesanan operasional, tidak membocorkan PII/kredensial
    const orders = await db.order.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const sanitizedOrders = orders.map((order) => {
      const firstItem = order.items[0]?.product?.name || null
      const extraItemsCount = Math.max(0, order.items.length - 1)
      const totalItemQty = order.items.reduce((acc, item) => acc + item.quantity, 0)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName?.trim() || order.user?.name || 'Pelanggan',
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt.toISOString(),
        totalItemQty,
        summaryText: firstItem
          ? `${firstItem}${extraItemsCount > 0 ? ` +${extraItemsCount} lainnya` : ''}`
          : `${totalItemQty} item`,
      }
    })

    return NextResponse.json({
      success: true,
      orders: sanitizedOrders,
    })
  } catch (error) {
    console.error('Error fetching order notifications:', error)
    return NextResponse.json({ error: 'Gagal mengambil data notifikasi.' }, { status: 500 })
  }
}
