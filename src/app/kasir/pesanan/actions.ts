'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function updateOrderStatus(orderId: string, status: 'MENUNGGU' | 'DIPROSES' | 'SIAP' | 'SELESAI' | 'DIBATALKAN') {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
    return { error: 'Tidak diizinkan. Hanya kasir atau admin yang dapat mengubah status.' }
  }

  try {
    await db.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    })
    revalidatePath('/kasir/pesanan')
    revalidatePath('/kasir')
    return { success: true }
  } catch (error: any) {
    return { error: 'Gagal memperbarui status pesanan.' }
  }
}

export async function updatePaymentStatus(orderId: string, status: 'PENDING' | 'PAID' | 'FAILED') {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
    return { error: 'Tidak diizinkan. Hanya kasir atau admin yang dapat mengubah pembayaran.' }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: status },
      })
      await tx.payment.update({
        where: { orderId: orderId },
        data: { 
          paymentStatus: status, 
          paidAt: status === 'PAID' ? new Date() : null 
        },
      })
    })
    revalidatePath('/kasir/pesanan')
    revalidatePath('/kasir/transaksi')
    return { success: true }
  } catch (error: any) {
    return { error: 'Gagal memperbarui status pembayaran.' }
  }
}

export async function confirmPayment(orderId: string) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
    return { error: 'Tidak diizinkan. Hanya kasir atau admin yang dapat mengkonfirmasi pembayaran.' }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID' },
      })
      await tx.payment.update({
        where: { orderId: orderId },
        data: { paymentStatus: 'PAID', paidAt: new Date() },
      })
    })
    revalidatePath('/kasir/pesanan')
    revalidatePath('/kasir/transaksi')
    return { success: true }
  } catch (error: any) {
    return { error: 'Gagal mengkonfirmasi pembayaran.' }
  }
}
