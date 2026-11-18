'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getStaffSession } from '@/lib/auth'
import { sendOrderCompletedNotificationToCustomer } from '@/lib/whatsappCloudApi'
import { sendOrderCompletedEmail } from '@/lib/nodemailerEmail'

async function triggerCustomerCompletedNotification(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    })

    if (!order) return

    // 1. Kirim notifikasi WhatsApp ke pelanggan
    try {
      await sendOrderCompletedNotificationToCustomer({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.user?.name || 'Pelanggan',
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        items: order.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
        })),
      })
    } catch (waError) {
      console.warn('[Kasir] Notifikasi WhatsApp ke pelanggan gagal dikirim (non-fatal):', waError)
    }

    // 2. Kirim email notifikasi pesanan selesai ke pelanggan via Resend
    try {
      const recipientEmail = order.customerEmail || order.user?.email || null

      const completedResult = await sendOrderCompletedEmail({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.user?.name || 'Pelanggan',
        customerEmail: recipientEmail,
        totalAmount: order.totalAmount,
      })

      if (completedResult.success) {
        console.log(
          `[Kasir - Email Accepted] Email pesanan selesai #${order.orderNumber} diterima provider (${completedResult.provider}): messageId=${completedResult.messageId} untuk penerima ${recipientEmail}`
        )
      } else if (completedResult.isSandboxRestriction) {
        console.warn(
          `[Kasir - Email Rejected] Resend Sandbox restriction: Email pesanan selesai #${order.orderNumber} ke ${recipientEmail} ditolak oleh Resend (HTTP 403) karena domain pengirim onboarding@resend.dev hanya mengizinkan akun terdaftar (${completedResult.sandboxAllowedRecipient || 'vikrim714@gmail.com'}).`
        )
      } else if (completedResult.skipped) {
        console.info(
          `[Kasir - Email Skipped] Pengiriman email selesai #${order.orderNumber} dilewati: ${completedResult.reason || 'Kredensial belum dikonfigurasi'}`
        )
      } else {
        console.warn(
          `[Kasir - Email Failed] Email pesanan selesai #${order.orderNumber} ke ${recipientEmail} gagal: ${completedResult.error || 'Penyedia email mengalami kendala'}`
        )
      }
    } catch (emailError) {
      console.error('[Kasir - Email Exception] Notifikasi email ke pelanggan gagal dikirim (non-fatal):', emailError)
    }
  } catch (error) {
    console.warn('[Kasir] Gagal memproses notifikasi selesai (non-fatal):', error)
  }
}

export async function updateOrderStatus(orderId: string, status: 'MENUNGGU' | 'SELESAI') {
  try {
    const session = await getStaffSession()
    if (!session?.user || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
      return { error: 'Akses ditolak: Hanya Kasir atau Administrator yang diizinkan mengelola pesanan.' }
    }

    await db.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    })

    // Jika diubah menjadi SELESAI, kirim notifikasi WhatsApp ke pelanggan
    if (status === 'SELESAI') {
      await triggerCustomerCompletedNotification(orderId)
    }

    revalidatePath('/kasir/transaksi')
    revalidatePath('/kasir')
    revalidatePath('/admin/pesanan')
    revalidatePath('/admin')
    return { success: true }
  } catch {
    return { error: 'Gagal memperbarui status pesanan.' }
  }
}

export async function updatePaymentStatus(orderId: string, status: 'PENDING' | 'PAID' | 'FAILED') {
  try {
    const session = await getStaffSession()
    if (!session?.user || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
      return { error: 'Akses ditolak: Hanya Kasir atau Administrator yang diizinkan mengelola status pembayaran.' }
    }

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
    revalidatePath('/kasir/transaksi')
    revalidatePath('/kasir')
    return { success: true }
  } catch {
    return { error: 'Gagal memperbarui status pembayaran.' }
  }
}

export async function confirmPayment(orderId: string) {
  try {
    const session = await getStaffSession()
    if (!session?.user || (session.user.role !== 'KASIR' && session.user.role !== 'ADMIN')) {
      return { error: 'Akses ditolak: Hanya Kasir atau Administrator yang diizinkan mengonfirmasi pembayaran.' }
    }

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', orderStatus: 'SELESAI' },
      })
      await tx.payment.update({
        where: { orderId: orderId },
        data: { paymentStatus: 'PAID', paidAt: new Date() },
      })
    })

    // Kirim notifikasi WhatsApp Cloud API otomatis ke pelanggan
    await triggerCustomerCompletedNotification(orderId)

    revalidatePath('/kasir/transaksi')
    revalidatePath('/kasir')
    revalidatePath('/admin/pesanan')
    revalidatePath('/admin')
    return { success: true }
  } catch {
    return { error: 'Gagal menyelesaikan pesanan.' }
  }
}
