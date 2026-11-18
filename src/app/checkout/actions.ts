'use server'

import { db } from '@/lib/db'
import { hash } from 'bcrypt'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendOrderNotificationToAdmin } from '@/lib/whatsappCloudApi'
import { sendOrderCreatedEmail, isValidEmail } from '@/lib/nodemailerEmail'
import { checkIsStoreOpen } from '@/lib/systemConfig'

export async function getStoreStatusAction() {
  return await checkIsStoreOpen()
}

export async function createOrder(data: {
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  items: { id: string; quantity: number; noodleType: string | null; spiceLevel: string | null; notes: string | null }[]
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER'
}) {
  if (!data.items || data.items.length === 0) {
    return { error: 'Keranjang belanja kosong.' }
  }

  if (!data.customerName || !data.customerName.trim()) {
    return { error: 'Nama pelanggan wajib diisi.' }
  }

  if (!data.customerEmail || !data.customerEmail.trim()) {
    return { error: 'Alamat email pelanggan wajib diisi untuk menerima konfirmasi pesanan.' }
  }

  if (!isValidEmail(data.customerEmail)) {
    return { error: 'Format alamat email pelanggan tidak valid (contoh: nama@email.com).' }
  }

  try {
    // 0. Cek Status Buka/Tutup Toko dari Konfigurasi Sistem
    let isStoreOpen = true
    let isEmailNotificationActive = true
    try {
      const storeConfig = await db.systemConfig.findUnique({
        where: { id: 'default' },
        select: { isOpen: true, emailOrderNotification: true },
      })
      if (storeConfig) {
        isStoreOpen = storeConfig.isOpen
        isEmailNotificationActive = storeConfig.emailOrderNotification
      }
    } catch (cfgErr) {
      console.warn('[Checkout] Gagal memeriksa SystemConfig (fallback terbuka):', cfgErr)
    }

    if (!isStoreOpen) {
      return {
        error: 'Maaf, toko sedang tutup dan belum menerima pesanan.',
      }
    }

    // 0B. Cek apakah ada sesi pengguna yang sedang login
    let orderUserId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      orderUserId = session?.user?.id || null
    } catch {
      // Diluar request context (misal standalone test suite)
    }

    // Jika checkout tanpa sesi login, periksa apakah email cocok dengan akun pelanggan terdaftar
    if (!orderUserId && data.customerEmail) {
      try {
        const existingUser = await db.user.findUnique({
          where: { email: data.customerEmail.trim().toLowerCase() },
          select: { id: true },
        })
        if (existingUser) {
          orderUserId = existingUser.id
        }
      } catch {
        // Abaikan error lookup opsional
      }
    }

    // 1. Ambil produk dari DB (Juga dilakukan di luar transaksi agar lebih cepat)
    const productIds = data.items.map(item => item.id)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    })

    const allowedNoodles = ['Mie Kuning', 'Mie Bihun', 'Mie Kuning + Bihun']

    // Validasi produk
    let totalAmount = 0
    const orderItemsData = []

    for (const item of data.items) {
      const product = products.find(p => p.id === item.id)

      if (!product) {
        throw new Error(`Produk tidak ditemukan.`)
      }

      if (!product.isAvailable) {
        throw new Error(`Produk ${product.name} sedang tidak tersedia.`)
      }

      const categoryName = (product.category?.name || '').toLowerCase().trim()
      const isBakso = categoryName === 'bakso' || categoryName === 'baso'
      const noodleType = isBakso ? (item.noodleType || '').trim() : null

      if (isBakso && (!noodleType || !allowedNoodles.includes(noodleType))) {
        throw new Error(`Pilih jenis mie untuk ${product.name}.`)
      }

      const subtotal = product.price * item.quantity
      totalAmount += subtotal

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: subtotal,
        noodleType,
        spiceLevel: item.spiceLevel,
        notes: item.notes
      })
    }

    // 2. Generate Nomor Order (ORD-YYYYMMDD-XXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const todayOrdersCount = await db.order.count({
      where: {
        orderNumber: {
          startsWith: `ORD-${dateStr}`,
        },
      },
    })
    const orderNumber = `ORD-${dateStr}-${(todayOrdersCount + 1).toString().padStart(3, '0')}`

    // 3. Buat Order menggunakan Guest ID (Dilakukan dalam 1 Nested Create/Implicit Transaction)
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: orderUserId,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone?.trim() || null,
        customerEmail: data.customerEmail?.trim().toLowerCase() || null,
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
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    // 4. Kirim notifikasi otomatis WhatsApp Cloud API ke nomor Admin
    try {
      await sendOrderNotificationToAdmin({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: data.paymentMethod,
        items: order.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          noodleType: it.noodleType,
          spiceLevel: it.spiceLevel,
          notes: it.notes,
        })),
      })
    } catch (waError) {
      console.warn('[Checkout] Pengiriman WhatsApp otomatis ke admin gagal (non-fatal):', waError)
    }

    // 5. Kirim email konfirmasi otomatis ke pelanggan sesuai alamat email checkout (jika diaktifkan di konfigurasi)
    if (!isEmailNotificationActive) {
      console.info(
        `[Checkout - Email Disabled] Pengiriman email konfirmasi pesanan #${order.orderNumber} dilewati karena dinonaktifkan di Konfigurasi Sistem.`
      )
    } else {
      try {
        const emailResult = await sendOrderCreatedEmail({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Pelanggan',
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: order.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.subtotal,
          noodleType: it.noodleType,
          spiceLevel: it.spiceLevel,
          notes: it.notes,
        })),
        createdAt: order.createdAt,
      })

      if (emailResult.success) {
        console.log(
          `[Checkout - Email Accepted] Email konfirmasi #${order.orderNumber} diterima oleh provider (${emailResult.provider}): messageId=${emailResult.messageId} untuk penerima ${order.customerEmail}`
        )
      } else if (emailResult.isSandboxRestriction) {
        console.warn(
          `[Checkout - Email Rejected] Resend Sandbox restriction: Email #${order.orderNumber} ke ${order.customerEmail} ditolak oleh Resend (HTTP 403) karena domain pengirim onboarding@resend.dev hanya mengizinkan pengiriman ke akun pemilik terdaftar (${emailResult.sandboxAllowedRecipient || 'vikrim714@gmail.com'}). Pesanan tetap sukses disimpan.`
        )
      } else if (emailResult.skipped) {
        console.info(
          `[Checkout - Email Skipped] Pengiriman email #${order.orderNumber} dilewati: ${emailResult.reason || 'Kredensial belum dikonfigurasi'}`
        )
      } else {
        console.warn(
          `[Checkout - Email Failed] Email konfirmasi #${order.orderNumber} ke ${order.customerEmail} gagal: ${emailResult.error || 'Penyedia email mengalami kendala'}`
        )
      }
      } catch (emailError) {
        console.error('[Checkout - Email Exception] Pengiriman email konfirmasi mengalami error (non-fatal):', emailError)
      }
    }

    try {
      revalidatePath('/kasir')
      revalidatePath('/kasir/transaksi')
      revalidatePath('/kasir', 'layout')
    } catch {
      // Diluar request context
    }

    return { success: true, orderId: order.id, orderNumber: order.orderNumber }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pesanan.'
    return { error: message }
  }
}
