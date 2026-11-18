import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { adminAuthOptions, kasirAuthOptions, customerAuthOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { askAI, ChatHistoryItem } from '@/app/ai/actions'

export async function POST(req: Request) {
  try {
    // 1. Verifikasi Autentikasi Pengguna di Server melalui NextAuth session cookies
    const [adminSession, kasirSession, customerSession] = await Promise.all([
      getServerSession(adminAuthOptions).catch(() => null),
      getServerSession(kasirAuthOptions).catch(() => null),
      getServerSession(customerAuthOptions).catch(() => null),
    ])

    // Tentukan sesi aktif berdasarkan token autentikasi server
    const activeSession =
      adminSession?.user?.role === 'ADMIN'
        ? adminSession
        : kasirSession?.user?.role === 'KASIR' || kasirSession?.user?.role === 'ADMIN'
        ? kasirSession
        : customerSession?.user?.role === 'PELANGGAN'
        ? customerSession
        : null

    // Tolak permintaan jika pengguna belum login atau sesi tidak valid (HTTP 401)
    if (!activeSession?.user?.id) {
      return NextResponse.json(
        { error: 'Akses ditolak: Sesi autentikasi tidak valid atau belum login.' },
        { status: 401 }
      )
    }

    // Verifikasi identitas user ke database untuk memastikan akun aktif dan valid
    const dbUser = await db.user.findUnique({
      where: { id: activeSession.user.id },
      select: { id: true, name: true, role: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Akses ditolak: Pengguna tidak terdaftar dalam sistem.' },
        { status: 401 }
      )
    }

    // Role pengguna murni berasal dari database hasil verifikasi sesi server
    const verifiedRole = dbUser.role as 'ADMIN' | 'KASIR' | 'PELANGGAN'

    // 2. Parse Request Body
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Format JSON pada request tidak valid.' },
        { status: 400 }
      )
    }

    const { prompt, portal, history, currentPath } = body || {}

    // 3. Validasi input prompt
    if (typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Format prompt tidak valid. Pesan harus berupa teks.' },
        { status: 400 }
      )
    }

    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) {
      return NextResponse.json(
        { error: 'Pesan prompt tidak boleh kosong.' },
        { status: 400 }
      )
    }

    if (cleanPrompt.length > 500) {
      return NextResponse.json(
        { error: 'Pesan prompt terlalu panjang (maksimal 500 karakter).' },
        { status: 400 }
      )
    }

    // 4. Validasi riwayat percakapan (history)
    let validatedHistory: ChatHistoryItem[] = []
    if (history !== undefined && history !== null) {
      if (!Array.isArray(history)) {
        return NextResponse.json(
          { error: 'Format riwayat chat tidak valid. History harus berupa array.' },
          { status: 400 }
        )
      }

      for (let i = 0; i < history.length; i++) {
        const item = history[i]
        if (
          !item ||
          typeof item !== 'object' ||
          (item.role !== 'user' && item.role !== 'ai') ||
          typeof item.content !== 'string'
        ) {
          return NextResponse.json(
            { error: `Item riwayat chat ke-${i + 1} tidak valid.` },
            { status: 400 }
          )
        }
      }

      // Batasi 10 riwayat pesan terakhir dan potong konten panjang untuk mencegah payload abuse
      validatedHistory = history.slice(-10).map((item) => ({
        role: item.role,
        content: String(item.content).slice(0, 1000),
      }))
    }

    // 5. Parameter portal HANYA sebagai konteks tampilan UI, TIDAK menjadi penentu hak akses
    // Pastikan konteks tampilan tidak melebihi wewenang role terverifikasi
    let displayPortalContext: 'admin' | 'kasir' | 'pelanggan' = verifiedRole.toLowerCase() as 'admin' | 'kasir' | 'pelanggan'
    if (typeof portal === 'string') {
      const requestedPortal = portal.toLowerCase().trim()
      if (verifiedRole === 'ADMIN' && (requestedPortal === 'admin' || requestedPortal === 'kasir')) {
        displayPortalContext = requestedPortal as 'admin' | 'kasir'
      } else if (verifiedRole === 'KASIR' && requestedPortal === 'kasir') {
        displayPortalContext = 'kasir'
      } else if (verifiedRole === 'PELANGGAN' && requestedPortal === 'pelanggan') {
        displayPortalContext = 'pelanggan'
      }
    }

    // 6. Teruskan ke askAI murni dengan data yang telah divalidasi tanpa injectedSession
    const result = await askAI(
      cleanPrompt,
      displayPortalContext,
      undefined, // Menghapus injectedSession (tidak diperbolehkan)
      validatedHistory,
      typeof currentPath === 'string' ? currentPath : undefined
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      products: result.products || [],
      role: verifiedRole,
    })
  } catch (error: unknown) {
    // 7. Penanganan error aman: catat error secara internal di server, jangan membocorkan detail sensitif ke frontend
    console.error('[API /api/ai Server Error]:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses permintaan AI. Silakan coba kembali.' },
      { status: 500 }
    )
  }
}
