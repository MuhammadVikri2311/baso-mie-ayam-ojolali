import { NextResponse } from 'next/server'
import {
  getWhatsAppConfigStatus,
  sendWhatsAppTextMessage,
  formatWhatsAppNumber,
} from '@/lib/whatsappCloudApi'

export const dynamic = 'force-dynamic'

/**
 * GET /api/whatsapp/test
 * Memeriksa status konfigurasi variabel Meta WhatsApp Cloud API di .env.local
 */
export async function GET() {
  const status = getWhatsAppConfigStatus()

  return NextResponse.json({
    status: 'ok',
    message: 'Status Konfigurasi WhatsApp Cloud API Resmi Meta',
    data: {
      isConfigured: status.isConfigured,
      missingKeys: status.missingKeys,
      details: {
        hasAccessToken: status.config.hasAccessToken,
        hasPhoneNumberId: status.config.hasPhoneNumberId,
        adminPhone: status.config.adminPhone,
        apiVersion: status.config.apiVersion,
      },
    },
    guide: status.isConfigured
      ? 'Kredensial WhatsApp Cloud API telah terkonfigurasi. Kirim HTTP POST ke endpoint ini untuk menguji pengiriman pesan uji coba.'
      : 'Kredensial belum lengkap. Silakan isi WHATSAPP_ACCESS_TOKEN dan WHATSAPP_PHONE_NUMBER_ID di file .env.local.',
  })
}

/**
 * POST /api/whatsapp/test
 * Menguji pengiriman pesan langsung via Meta WhatsApp Cloud API
 * Body (opsional): { "to": "08123456789", "message": "Tes pesan" }
 */
export async function POST(request: Request) {
  try {
    const status = getWhatsAppConfigStatus()
    if (!status.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Konfigurasi belum lengkap',
          missingKeys: status.missingKeys,
          message:
            'Pastikan WHATSAPP_ACCESS_TOKEN dan WHATSAPP_PHONE_NUMBER_ID telah diisi di file .env.local sebelum menguji pengiriman.',
        },
        { status: 400 }
      )
    }

    let body: { to?: string; message?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const targetPhone =
      body.to || process.env.WHATSAPP_ADMIN_PHONE || '6281316520717'
    const message =
      body.message ||
      `Halo! Ini adalah pesan uji coba integrasi resmi Meta WhatsApp Cloud API dari sistem Baso & Mie Ayam Ojolali. Waktu: ${new Date().toLocaleString('id-ID')}`

    const result = await sendWhatsAppTextMessage(targetPhone, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Pesan uji coba berhasil dikirim ke Meta WhatsApp Cloud API!',
        recipient: formatWhatsAppNumber(targetPhone),
        messageId: result.messageId,
        metaResponse: result.raw,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.reason || 'Gagal mengirim pesan ke WhatsApp Cloud API',
          status: result.status,
          metaResponse: result.raw,
        },
        { status: result.status || 500 }
      )
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kesalahan internal'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
