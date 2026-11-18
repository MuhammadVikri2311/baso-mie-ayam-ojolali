/**
 * Layanan Pengiriman Email Notifikasi Terpadu (Unified Email Service)
 * Baso & Mie Ayam Ojolali
 * 
 * Mendukung Resend (Primary SDK) dan Nodemailer Gmail SMTP (Fallback).
 * Dilengkapi deteksi status Sandbox Resend, deduplikasi database, concurrency locking,
 * dan penanganan error yang aman dan transparan tanpa mengekspos kredensial rahasia.
 */

import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { db } from './db'

export interface EmailProviderConfigStatus {
  resend: {
    isConfigured: boolean
    hasApiKey: boolean
    from: string
    isSandbox: boolean
    sandboxAllowedRecipient: string
  }
  gmail: {
    isConfigured: boolean
    hasUser: boolean
    hasPass: boolean
    user: string | null
    from: string
  }
  activeProvider: 'resend' | 'gmail' | 'none'
}

// In-flight concurrency lock untuk mencegah pengiriman email ganda simultan
const inFlightOrderEmails = new Set<string>()
const inFlightCompletedEmails = new Set<string>()

/**
 * Validasi dan deteksi konfigurasi penyedia email di lingkungan server
 */
export function getEmailConfigStatus(): EmailProviderConfigStatus {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() || ''
  const resendFrom =
    process.env.RESEND_FROM_EMAIL?.trim() || 'Baso & Mie Ayam Ojolali <onboarding@resend.dev>'
  const isResendSandbox = resendFrom.includes('onboarding@resend.dev')

  const gmailUser = process.env.GMAIL_USER?.trim() || null
  const rawGmailPass = process.env.GMAIL_APP_PASS || ''
  const gmailPass = rawGmailPass.replace(/\s+/g, '').trim() || null
  const gmailFromName = process.env.GMAIL_FROM_NAME?.trim() || 'Baso & Mie Ayam Ojolali'

  const resendConfigured = Boolean(resendApiKey)
  const gmailConfigured = Boolean(gmailUser && gmailPass)

  let activeProvider: 'resend' | 'gmail' | 'none' = 'none'
  if (resendConfigured) {
    activeProvider = 'resend'
  } else if (gmailConfigured) {
    activeProvider = 'gmail'
  }

  return {
    resend: {
      isConfigured: resendConfigured,
      hasApiKey: Boolean(resendApiKey),
      from: resendFrom,
      isSandbox: isResendSandbox,
      sandboxAllowedRecipient: 'vikrim714@gmail.com',
    },
    gmail: {
      isConfigured: gmailConfigured,
      hasUser: Boolean(gmailUser),
      hasPass: Boolean(gmailPass),
      user: gmailUser,
      from: gmailUser ? `"${gmailFromName}" <${gmailUser}>` : `"${gmailFromName}"`,
    },
    activeProvider,
  }
}

/**
 * Alias untuk kompatibilitas mundur getGmailConfigStatus
 */
export function getGmailConfigStatus() {
  const status = getEmailConfigStatus()
  return {
    isConfigured: status.gmail.isConfigured,
    hasUser: status.gmail.hasUser,
    hasPass: status.gmail.hasPass,
    user: status.gmail.user,
    from: status.gmail.from,
  }
}

/**
 * Validasi format email standar RFC
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false
  const trimmed = email.trim()
  if (trimmed.length > 254) return false
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return emailRegex.test(trimmed)
}

/**
 * Membuat instance Nodemailer SMTP Transporter untuk Gmail (jika dibutuhkan sebagai fallback)
 */
function createGmailTransporter() {
  const user = process.env.GMAIL_USER?.trim()
  const pass = process.env.GMAIL_APP_PASS?.replace(/\s+/g, '').trim()

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })
}

export interface SendEmailResult {
  success: boolean
  skipped?: boolean
  provider?: 'resend' | 'gmail' | 'none'
  messageId?: string
  error?: string
  reason?: string
  statusCode?: number
  isSandboxRestriction?: boolean
  sandboxAllowedRecipient?: string
  note?: string
}

export interface OrderItemEmailData {
  name: string
  quantity: number
  price: number
  subtotal: number
  noodleType?: string | null
  spiceLevel?: string | null
  notes?: string | null
}

export interface OrderEmailData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  totalAmount: number
  paymentMethod?: string | null
  paymentStatus?: string | null
  orderStatus?: string | null
  items: OrderItemEmailData[]
  createdAt?: Date | string
}

/**
 * Template HTML Responsif untuk Konfirmasi Pesanan Baru (Status: MENUNGGU)
 */
export function renderOrderCreatedEmailHtml(data: OrderEmailData): string {
  const orderDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  const itemsHtml = data.items
    .map((item, index) => {
      const customs: string[] = []
      if (item.noodleType) customs.push(`Mie: ${item.noodleType}`)
      if (item.spiceLevel) customs.push(`Pedas: ${item.spiceLevel}`)
      if (item.notes) customs.push(`Catatan: ${item.notes}`)
      const customString =
        customs.length > 0
          ? `<div style="font-size: 11px; color: #78716c; margin-top: 4px;">${customs.join(' • ')}</div>`
          : ''

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4;">
            <div style="font-weight: 600; color: #1c1917; font-size: 14px;">${index + 1}. ${item.name}</div>
            ${customString}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f5f5f4; text-align: center; color: #ea580c; font-weight: 700; font-size: 14px;">
            ×${item.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; text-align: right; color: #1c1917; font-weight: 600; font-size: 14px;">
            Rp${item.subtotal.toLocaleString('id-ID')}
          </td>
        </tr>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pesanan #${data.orderNumber} - Baso &amp; Mie Ayam Ojolali</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #292524;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7e5e4;">
          <!-- Header Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Baso &amp; Mie Ayam Ojolali</h1>
              <p style="margin: 6px 0 0 0; color: #ffedd5; font-size: 13px;">Cita Rasa Istimewa • Gurih, Mantap &amp; Nikmat</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fde68a;">
                  Status: ${data.orderStatus || 'MENUNGGU'}
                </span>
                <h2 style="margin: 14px 0 6px 0; color: #1c1917; font-size: 20px; font-weight: 700;">Pesanan Berhasil Diterima!</h2>
                <p style="margin: 0; color: #78716c; font-size: 13px;">Halo <strong>${data.customerName}</strong>, terima kasih telah memesan. Pesanan Anda telah tersimpan dan siap diproses di dapur kami.</p>
              </div>

              <!-- Kartu Rincian Order -->
              <table role="presentation" width="100%" style="background-color: #f5f5f4; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #78716c; padding: 4px 0;">Nomor Pesanan:</td>
                  <td style="font-size: 14px; font-weight: 700; color: #1c1917; text-align: right; font-family: monospace;">#${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716c; padding: 4px 0;">Waktu Pemesanan:</td>
                  <td style="font-size: 12px; font-weight: 600; color: #44403c; text-align: right;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716c; padding: 4px 0;">Metode Pembayaran:</td>
                  <td style="font-size: 12px; font-weight: 700; color: #ea580c; text-align: right; text-transform: uppercase;">${data.paymentMethod || 'CASH'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #78716c; padding: 4px 0;">Status Pembayaran:</td>
                  <td style="font-size: 12px; font-weight: 700; color: #44403c; text-align: right; text-transform: uppercase;">${data.paymentStatus || 'PENDING'}</td>
                </tr>
              </table>

              <!-- Tabel Menu -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #44403c; text-transform: uppercase; letter-spacing: 0.5px;">Rincian Menu</h3>
                <table role="presentation" width="100%" style="border-collapse: collapse;">
                  ${itemsHtml}
                </table>
              </div>

              <!-- Total Tagihan -->
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="font-size: 14px; font-weight: 700; color: #9a3412;">Total Pembayaran:</td>
                    <td style="font-size: 20px; font-weight: 800; color: #ea580c; text-align: right;">Rp${data.totalAmount.toLocaleString('id-ID')}</td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0; text-align: center; font-size: 12px; color: #a8a29e;">
                Anda juga akan menerima email pemberitahuan otomatis saat pesanan telah SELESAI disiapkan.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f4; padding: 20px 28px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #44403c; font-size: 12px;">Baso &amp; Mie Ayam Ojolali</p>
              <p style="margin: 0; color: #78716c; font-size: 11px;">Jl. Gn. Galunggung Permai No. 25, Kota Cirebon • WhatsApp: 0813-1652-0717</p>
              <p style="margin: 8px 0 0 0; color: #a8a29e; font-size: 10px;">Email ini dikirim otomatis oleh sistem resmi UMKM Ojolali.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Template HTML Responsif untuk Pesanan SELESAI
 */
export function renderOrderCompletedEmailHtml(data: {
  orderId: string
  orderNumber: string
  customerName: string
  totalAmount: number
}): string {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pesanan Selesai #${data.orderNumber} - Baso &amp; Mie Ayam Ojolali</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #292524;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7e5e4;">
          <!-- Header Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Baso &amp; Mie Ayam Ojolali</h1>
              <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 13px;">Hidangan Hangat &amp; Lezat Siap Dinikmati</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bbf7d0;">
                  Status: SELESAI
                </span>
                <h2 style="margin: 14px 0 6px 0; color: #1c1917; font-size: 22px; font-weight: 800;">Pesanan Anda Telah Selesai! 🎉</h2>
                <p style="margin: 0; color: #78716c; font-size: 14px;">Halo <strong>${data.customerName}</strong>, kabar gembira! Pesanan Anda telah selesai disiapkan oleh staf kami.</p>
              </div>

              <!-- Kartu Rincian Order -->
              <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #166534; padding: 4px 0;">Nomor Pesanan:</td>
                  <td style="font-size: 15px; font-weight: 800; color: #14532d; text-align: right; font-family: monospace;">#${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #166534; padding: 4px 0;">Total Tagihan:</td>
                  <td style="font-size: 15px; font-weight: 800; color: #14532d; text-align: right;">Rp${data.totalAmount.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #166534; padding: 4px 0;">Status Pesanan:</td>
                  <td style="font-size: 12px; font-weight: 800; color: #059669; text-align: right;">SELESAI / SIAP AMBIL</td>
                </tr>
              </table>

              <!-- Instruksi Pengambilan -->
              <div style="background-color: #f5f5f4; border-radius: 14px; padding: 16px 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #1c1917; font-size: 13px;">📍 Instruksi Pengambilan:</p>
                <p style="margin: 0; color: #57534e; font-size: 12px; line-height: 1.5;">
                  Silakan tunjukkan nomor pesanan <strong>#${data.orderNumber}</strong> ke kasir atau meja pengambilan pesanan Baso &amp; Mie Ayam Ojolali untuk mengambil hidangan Anda.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 16px;">
                <a href="${appUrl}/pesanan/${data.orderId}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                  Buka Rincian Pesanan
                </a>
              </div>

              <p style="margin: 0; text-align: center; font-size: 12px; color: #a8a29e;">
                Selamat menikmati hidangan kami! Terima kasih atas kunjungan dan kepercayaan Anda. 🙏
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f4; padding: 20px 28px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #44403c; font-size: 12px;">Baso &amp; Mie Ayam Ojolali</p>
              <p style="margin: 0; color: #78716c; font-size: 11px;">Jl. Gn. Galunggung Permai No. 25, Kota Cirebon • WhatsApp: 0813-1652-0717</p>
              <p style="margin: 8px 0 0 0; color: #a8a29e; font-size: 10px;">Email ini dikirim otomatis oleh sistem resmi UMKM Ojolali.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * 1. Kirim Email Konfirmasi Pesanan Baru kepada Pelanggan setelah checkout
 */
export async function sendOrderCreatedEmail(data: OrderEmailData): Promise<SendEmailResult> {
  const orderIdentifier = data.orderId || data.orderNumber

  // 1. Cek validitas format email penerima
  if (!isValidEmail(data.customerEmail)) {
    const reason = `Email pelanggan tidak valid atau kosong ("${data.customerEmail || ''}"). Melewati pengiriman email konfirmasi.`
    console.log(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  // 2. Cegah request ganda konkuren (In-flight concurrency deduplication)
  if (orderIdentifier && inFlightOrderEmails.has(orderIdentifier)) {
    const reason = `Pengiriman email konfirmasi pesanan #${data.orderNumber} sedang berjalan. Melewati duplikasi.`
    console.warn(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  // 3. Cek database deduplication (apakah sudah pernah dikirim sebelumnya)
  if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
    try {
      const order = await db.order.findUnique({
        where: { id: data.orderId },
        select: { emailOrderNotifiedAt: true },
      })
      if (order?.emailOrderNotifiedAt) {
        const reason = `Email konfirmasi pesanan #${data.orderNumber} sudah pernah terkirim pada ${order.emailOrderNotifiedAt.toISOString()}. Melewati untuk mencegah spam.`
        console.log(`[Email Service] ${reason}`)
        return { success: true, skipped: true, reason }
      }
    } catch (dbErr: unknown) {
      console.warn('[Email Service] Gagal memeriksa emailOrderNotifiedAt di DB:', dbErr)
    }
  }

  const config = getEmailConfigStatus()
  if (config.activeProvider === 'none') {
    const reason =
      'Kredensial email (RESEND_API_KEY atau GMAIL_USER/GMAIL_APP_PASS) belum terkonfigurasi di .env.local.'
    console.warn(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason, provider: 'none' }
  }

  const targetEmail = data.customerEmail!.trim().toLowerCase()
  if (orderIdentifier) {
    inFlightOrderEmails.add(orderIdentifier)
  }

  try {
    const htmlContent = renderOrderCreatedEmailHtml(data)
    const subject = `Konfirmasi Pesanan #${data.orderNumber} - Baso & Mie Ayam Ojolali`

    // A. Coba kirim via Resend jika tersedia
    if (config.resend.isConfigured) {
      const resend = new Resend(process.env.RESEND_API_KEY!.trim())
      const { data: resendData, error: resendError } = await resend.emails.send({
        from: config.resend.from,
        to: [targetEmail],
        subject,
        html: htmlContent,
      })

      if (!resendError && resendData?.id) {
        console.log(
          `[Email Service - Resend Success] Email konfirmasi #${data.orderNumber} terkirim ke ${targetEmail} (Message ID: ${resendData.id})`
        )

        // Catat timestamp sukses di database
        if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
          try {
            await db.order.update({
              where: { id: data.orderId },
              data: { emailOrderNotifiedAt: new Date() },
            })
          } catch (updateErr: unknown) {
            console.warn('[Email Service] Gagal mencatat emailOrderNotifiedAt:', updateErr)
          }
        }

        return {
          success: true,
          provider: 'resend',
          messageId: resendData.id,
        }
      }

      // Resend menolak pengiriman
      const resendErrObj = resendError as { statusCode?: number; message?: string } | null
      const statusCode = resendErrObj?.statusCode || 400
      const errMsg = resendErrObj?.message || 'Resend API Error'
      const isSandboxRestriction =
        statusCode === 403 ||
        errMsg.toLowerCase().includes('testing emails to your own email address') ||
        errMsg.toLowerCase().includes('sandbox')

      console.warn(
        `[Email Service - Resend Rejected] Status ${statusCode}: ${errMsg} (Penerima: ${targetEmail})`
      )

      if (isSandboxRestriction) {
        console.info(
          `[Resend Sandbox Notice] Resend akun saat ini dalam mode Sandbox (domain onboarding@resend.dev). Resend membatasi penerima hanya ke akun terdaftar (${config.resend.sandboxAllowedRecipient}). Untuk mengirim ke alamat pelanggan lain, verifikasi domain kustom di resend.com/domains.`
        )
      }

      // Coba fallback ke Gmail SMTP jika Gmail terkonfigurasi
      if (config.gmail.isConfigured) {
        console.log('[Email Service] Mencoba pengiriman fallback via Gmail SMTP...')
        const transporter = createGmailTransporter()
        if (transporter) {
          try {
            const info = await transporter.sendMail({
              from: config.gmail.from,
              to: targetEmail,
              subject,
              html: htmlContent,
            })

            console.log(
              `[Email Service - Gmail Fallback Success] Email #${data.orderNumber} terkirim via Gmail SMTP ke ${targetEmail} (ID: ${info.messageId})`
            )

            if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
              await db.order.update({
                where: { id: data.orderId },
                data: { emailOrderNotifiedAt: new Date() },
              })
            }

            return {
              success: true,
              provider: 'gmail',
              messageId: info.messageId,
              note: 'Terkirim via fallback Gmail SMTP karena Resend menolak pengiriman.',
            }
          } catch (gmailErr: unknown) {
            const err = gmailErr instanceof Error ? gmailErr.message : String(gmailErr)
            console.warn('[Email Service - Gmail Fallback Error]:', err)
          }
        }
      }

      // Jangan pernah menampilkan "terkirim" jika provider menolak permintaan
      return {
        success: false,
        provider: 'resend',
        statusCode,
        isSandboxRestriction,
        sandboxAllowedRecipient: config.resend.sandboxAllowedRecipient,
        error: errMsg,
      }
    }

    // B. Kirim via Gmail SMTP murni jika Resend tidak dikonfigurasi
    if (config.gmail.isConfigured) {
      const transporter = createGmailTransporter()
      if (!transporter) {
        return {
          success: false,
          provider: 'gmail',
          error: 'Transporter Gmail SMTP gagal diinisialisasi.',
        }
      }

      const info = await transporter.sendMail({
        from: config.gmail.from,
        to: targetEmail,
        subject,
        html: htmlContent,
      })

      if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
        await db.order.update({
          where: { id: data.orderId },
          data: { emailOrderNotifiedAt: new Date() },
        })
      }

      return {
        success: true,
        provider: 'gmail',
        messageId: info.messageId,
      }
    }

    return {
      success: false,
      provider: 'none',
      error: 'Tidak ada penyedia email yang valid dan aktif.',
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan sistem pengiriman email'
    console.error(`[Email Service Error] Gagal mengirim email konfirmasi ke ${targetEmail}: ${msg}`)
    return {
      success: false,
      error: msg,
    }
  } finally {
    if (orderIdentifier) {
      inFlightOrderEmails.delete(orderIdentifier)
    }
  }
}

/**
 * 2. Kirim Email Notifikasi Pesanan Selesai kepada Pelanggan saat kasir mengubah status ke SELESAI
 */
export async function sendOrderCompletedEmail(data: {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  totalAmount: number
}): Promise<SendEmailResult> {
  const orderIdentifier = data.orderId || data.orderNumber

  if (!isValidEmail(data.customerEmail)) {
    const reason = `Email pelanggan tidak valid atau kosong ("${data.customerEmail || ''}"). Melewati pengiriman email pesanan selesai.`
    console.log(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  if (orderIdentifier && inFlightCompletedEmails.has(orderIdentifier)) {
    const reason = `Pengiriman email selesai untuk pesanan #${data.orderNumber} sedang berjalan. Melewati duplikasi.`
    console.warn(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason }
  }

  // Deduplikasi database: periksa apakah sudah pernah dikirim
  if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
    try {
      const order = await db.order.findUnique({
        where: { id: data.orderId },
        select: { emailCompletedNotifiedAt: true },
      })
      if (order?.emailCompletedNotifiedAt) {
        const reason = `Email pesanan selesai #${data.orderNumber} sudah pernah terkirim pada ${order.emailCompletedNotifiedAt.toISOString()}. Melewati untuk mencegah duplikasi.`
        console.log(`[Email Service] ${reason}`)
        return { success: true, skipped: true, reason }
      }
    } catch (dbErr: unknown) {
      console.warn('[Email Service] Gagal memeriksa emailCompletedNotifiedAt di DB:', dbErr)
    }
  }

  const config = getEmailConfigStatus()
  if (config.activeProvider === 'none') {
    const reason =
      'Kredensial email (RESEND_API_KEY atau GMAIL_USER/GMAIL_APP_PASS) belum terkonfigurasi di .env.local.'
    console.warn(`[Email Service] ${reason}`)
    return { success: false, skipped: true, reason, provider: 'none' }
  }

  const targetEmail = data.customerEmail!.trim().toLowerCase()
  if (orderIdentifier) {
    inFlightCompletedEmails.add(orderIdentifier)
  }

  try {
    const htmlContent = renderOrderCompletedEmailHtml(data)
    const subject = `Pesanan Anda Telah Selesai! #${data.orderNumber} - Baso & Mie Ayam Ojolali`

    // A. Coba kirim via Resend jika tersedia
    if (config.resend.isConfigured) {
      const resend = new Resend(process.env.RESEND_API_KEY!.trim())
      const { data: resendData, error: resendError } = await resend.emails.send({
        from: config.resend.from,
        to: [targetEmail],
        subject,
        html: htmlContent,
      })

      if (!resendError && resendData?.id) {
        console.log(
          `[Email Service - Resend Success] Email pesanan selesai #${data.orderNumber} terkirim ke ${targetEmail} (Message ID: ${resendData.id})`
        )

        if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
          try {
            await db.order.update({
              where: { id: data.orderId },
              data: { emailCompletedNotifiedAt: new Date() },
            })
          } catch (updateErr: unknown) {
            console.warn('[Email Service] Gagal mencatat emailCompletedNotifiedAt:', updateErr)
          }
        }

        return {
          success: true,
          provider: 'resend',
          messageId: resendData.id,
        }
      }

      const resendErrObj = resendError as { statusCode?: number; message?: string } | null
      const statusCode = resendErrObj?.statusCode || 400
      const errMsg = resendErrObj?.message || 'Resend API Error'
      const isSandboxRestriction =
        statusCode === 403 ||
        errMsg.toLowerCase().includes('testing emails to your own email address') ||
        errMsg.toLowerCase().includes('sandbox')

      console.warn(
        `[Email Service - Resend Rejected] Status ${statusCode}: ${errMsg} (Penerima: ${targetEmail})`
      )

      // Fallback ke Gmail SMTP jika terkonfigurasi
      if (config.gmail.isConfigured) {
        console.log('[Email Service] Mencoba pengiriman pesanan selesai via Gmail SMTP fallback...')
        const transporter = createGmailTransporter()
        if (transporter) {
          try {
            const info = await transporter.sendMail({
              from: config.gmail.from,
              to: targetEmail,
              subject,
              html: htmlContent,
            })

            console.log(
              `[Email Service - Gmail Fallback Success] Email selesai #${data.orderNumber} terkirim via Gmail SMTP ke ${targetEmail} (ID: ${info.messageId})`
            )

            if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
              await db.order.update({
                where: { id: data.orderId },
                data: { emailCompletedNotifiedAt: new Date() },
              })
            }

            return {
              success: true,
              provider: 'gmail',
              messageId: info.messageId,
              note: 'Terkirim via fallback Gmail SMTP karena Resend menolak pengiriman.',
            }
          } catch (gmailErr: unknown) {
            const err = gmailErr instanceof Error ? gmailErr.message : String(gmailErr)
            console.warn('[Email Service - Gmail Fallback Error]:', err)
          }
        }
      }

      return {
        success: false,
        provider: 'resend',
        statusCode,
        isSandboxRestriction,
        sandboxAllowedRecipient: config.resend.sandboxAllowedRecipient,
        error: errMsg,
      }
    }

    // B. Kirim via Gmail SMTP jika Resend tidak ada
    if (config.gmail.isConfigured) {
      const transporter = createGmailTransporter()
      if (!transporter) {
        return {
          success: false,
          provider: 'gmail',
          error: 'Transporter Gmail SMTP gagal diinisialisasi.',
        }
      }

      const info = await transporter.sendMail({
        from: config.gmail.from,
        to: targetEmail,
        subject,
        html: htmlContent,
      })

      if (data.orderId && !data.orderId.startsWith('TEST-EMAIL-')) {
        await db.order.update({
          where: { id: data.orderId },
          data: { emailCompletedNotifiedAt: new Date() },
        })
      }

      return {
        success: true,
        provider: 'gmail',
        messageId: info.messageId,
      }
    }

    return {
      success: false,
      provider: 'none',
      error: 'Tidak ada penyedia email yang valid dan aktif.',
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan sistem pengiriman email'
    console.error(`[Email Service Error] Gagal mengirim email selesai ke ${targetEmail}: ${msg}`)
    return {
      success: false,
      error: msg,
    }
  } finally {
    if (orderIdentifier) {
      inFlightCompletedEmails.delete(orderIdentifier)
    }
  }
}
