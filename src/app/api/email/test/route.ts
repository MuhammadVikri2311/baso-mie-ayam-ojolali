import { NextResponse } from 'next/server'
import {
  getEmailConfigStatus,
  isValidEmail,
  sendOrderCreatedEmail,
  sendOrderCompletedEmail,
} from '@/lib/emailService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/email/test
 * Cek status konfigurasi Resend dan Gmail SMTP di .env.local
 */
export async function GET() {
  const config = getEmailConfigStatus()

  return NextResponse.json({
    status: 'ok',
    service: 'Unified Email Notification Service - Baso & Mie Ayam Ojolali',
    activeProvider: config.activeProvider,
    providers: {
      resend: {
        configured: config.resend.isConfigured,
        hasApiKey: config.resend.hasApiKey,
        fromAddress: config.resend.from,
        isSandboxMode: config.resend.isSandbox,
        allowedRecipientSandbox: config.resend.isSandbox
          ? config.resend.sandboxAllowedRecipient
          : 'Semua alamat email pelanggan (Domain Kustom Terverifikasi)',
        note: config.resend.isSandbox
          ? 'Mode Sandbox aktif (onboarding@resend.dev). Email nyata hanya dapat dikirim ke akun terdaftar (vikrim714@gmail.com). Pengiriman ke alamat lain akan ditolak oleh Resend (HTTP 403).'
          : 'Domain kustom aktif. Dapat mengirim ke seluruh pelanggan.',
      },
      gmailSmtp: {
        configured: config.gmail.isConfigured,
        hasUser: config.gmail.hasUser,
        hasPass: config.gmail.hasPass,
        user: config.gmail.user,
        from: config.gmail.from,
        note: config.gmail.isConfigured
          ? 'Gmail SMTP terkonfigurasi sebagai penyedia / jalur cadangan.'
          : 'GMAIL_USER / GMAIL_APP_PASS belum lengkap di .env.local.',
      },
    },
    testingGuide: {
      toAllowedAddress: `Kirim POST dengan { "to": "${config.resend.sandboxAllowedRecipient}", "type": "created" } untuk menguji pengiriman berhasil via Resend Sandbox.`,
      toExternalAddress:
        'Kirim POST dengan { "to": "pelanggan@domain.com" } untuk memvalidasi penanganan penolakan Sandbox (HTTP 403) yang aman.',
    },
  })
}

/**
 * POST /api/email/test
 * Menguji pengiriman email nyata ke alamat tujuan
 * Body JSON:
 * {
 *   "to": "email.tujuan@domain.com",
 *   "type": "created" | "completed" (default: "created")
 * }
 */
export async function POST(request: Request) {
  try {
    const config = getEmailConfigStatus()
    if (config.activeProvider === 'none') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Kredensial email (RESEND_API_KEY atau GMAIL_USER/GMAIL_APP_PASS) belum terkonfigurasi di file .env.local.',
        },
        { status: 400 }
      )
    }

    let body: { to?: string; type?: 'created' | 'completed' } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    if (!body.to || !isValidEmail(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Alamat email tujuan tidak valid atau kosong. Masukkan format JSON: { "to": "email@domain.com" }',
        },
        { status: 400 }
      )
    }

    const type = body.type || 'created'
    const dummyOrderId = `TEST-EMAIL-${Date.now()}`

    if (type === 'completed') {
      const result = await sendOrderCompletedEmail({
        orderId: dummyOrderId,
        orderNumber: `ORD-TEST-001`,
        customerName: 'Pelanggan Uji Coba Ojolali',
        customerEmail: body.to,
        totalAmount: 36000,
      })

      return NextResponse.json({
        type: 'Pesanan Selesai (SELESAI)',
        recipient: body.to,
        result,
        providerDiagnosis: result.success
          ? `Email BERHASIL diterima provider (${result.provider}) dengan Message ID: ${result.messageId}`
          : result.isSandboxRestriction
          ? `Email DITOLAK oleh Resend Sandbox (HTTP ${result.statusCode}): Mode Sandbox onboarding@resend.dev hanya mengizinkan pengiriman ke ${config.resend.sandboxAllowedRecipient}.`
          : `Pengiriman gagal: ${result.error}`,
      })
    } else {
      const result = await sendOrderCreatedEmail({
        orderId: dummyOrderId,
        orderNumber: `ORD-TEST-001`,
        customerName: 'Pelanggan Uji Coba Ojolali',
        customerEmail: body.to,
        totalAmount: 36000,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        orderStatus: 'MENUNGGU',
        items: [
          {
            name: 'Bakso Rusuk',
            quantity: 2,
            price: 18000,
            subtotal: 36000,
            noodleType: 'Mie Kuning',
            spiceLevel: 'Sedang',
            notes: 'Banyakin daun bawang',
          },
        ],
      })

      return NextResponse.json({
        type: 'Konfirmasi Pesanan Baru (MENUNGGU)',
        recipient: body.to,
        result,
        providerDiagnosis: result.success
          ? `Email BERHASIL diterima provider (${result.provider}) dengan Message ID: ${result.messageId}`
          : result.isSandboxRestriction
          ? `Email DITOLAK oleh Resend Sandbox (HTTP ${result.statusCode}): Mode Sandbox onboarding@resend.dev hanya mengizinkan pengiriman ke ${config.resend.sandboxAllowedRecipient}.`
          : `Pengiriman gagal: ${result.error}`,
      })
    }
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'Kesalahan server tidak diketahui'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
