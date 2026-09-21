'use server'

import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createOrder(data: {
  items: { id: string; quantity: number }[]
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER'
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: 'Anda harus login untuk melakukan pemesanan.' }
  }

  if (!data.items || data.items.length === 0) {
    return { error: 'Keranjang belanja kosong.' }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Validasi produk & ketersediaan, dan ambil harga dari DB (server-side calculation)
      let totalAmount = 0
      const orderItemsData = []

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        })

        if (!product) {
          throw new Error(`Produk dengan ID ${item.id} tidak ditemukan.`)
        }

        if (!product.isAvailable) {
          throw new Error(`Produk ${product.name} sedang tidak tersedia.`)
        }

        const subtotal = product.price * item.quantity
        totalAmount += subtotal

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          subtotal: subtotal,
        })
      }

      // 2. Generate Nomor Order (ORD-YYYYMMDD-XXX)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const todayOrdersCount = await tx.order.count({
        where: {
          orderNumber: {
            startsWith: `ORD-${dateStr}`,
          },
        },
      })
      const orderNumber = `ORD-${dateStr}-${(todayOrdersCount + 1).toString().padStart(3, '0')}`

      // 3. Buat Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          totalAmount,
          paymentStatus: 'PENDING',
          orderStatus: 'MENUNGGU',
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              paymentMethod: data.paymentMethod,
              amount: totalAmount,
              paymentStatus: 'PENDING',
            },
          },
        },
      })

      return order
    })

    return { success: true, orderId: result.id, orderNumber: result.orderNumber }
  } catch (error: any) {
    return { error: error.message || 'Terjadi kesalahan saat memproses pesanan.' }
  }
}
