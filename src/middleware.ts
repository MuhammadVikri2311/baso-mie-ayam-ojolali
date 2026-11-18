import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const secret = process.env.NEXTAUTH_SECRET || 'rahasia-ojolali-2026-website'

  // 1. RUTE PANEL ADMINISTRATOR (/admin dan /admin/*)
  if (path === '/admin' || path.startsWith('/admin/')) {
    const adminToken = await getToken({
      req,
      secret,
      cookieName: 'ojolali-admin.session-token',
    })

    if (path === '/admin/login') {
      if (adminToken && adminToken.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.next()
    }

    if (!adminToken || adminToken.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    return NextResponse.next()
  }

  // 2. RUTE PANEL KASIR (/kasir dan /kasir/*)
  if (path === '/kasir' || path.startsWith('/kasir/')) {
    const kasirToken = await getToken({
      req,
      secret,
      cookieName: 'ojolali-kasir.session-token',
    })

    if (path === '/kasir/login') {
      if (kasirToken && (kasirToken.role === 'KASIR' || kasirToken.role === 'ADMIN')) {
        return NextResponse.redirect(new URL('/kasir', req.url))
      }
      return NextResponse.next()
    }

    if (!kasirToken || (kasirToken.role !== 'KASIR' && kasirToken.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/kasir/login', req.url))
    }

    return NextResponse.next()
  }

  // 3. RUTE HALAMAN LOGIN & REGISTER PELANGGAN (/login, /register)
  // Biarkan halaman login tetap dapat diakses agar pengguna bisa berganti akun kapan saja
  if (path === '/login' || path === '/register') {
    return NextResponse.next()
  }

  // 4. RUTE KHUSUS PELANGGAN TERAUTENTIKASI (/pesanan, /riwayat, /profil)
  // Catatan: /pesanan/[id] dan /pesanan/sukses/[id] tetap terbuka agar struk guest bisa dibuka
  if (
    path === '/pesanan' ||
    path === '/riwayat' ||
    path.startsWith('/riwayat/') ||
    path === '/profil' ||
    path.startsWith('/profil/')
  ) {
    const customerToken = await getToken({
      req,
      secret,
      cookieName: 'ojolali-pelanggan.session-token',
    })

    if (!customerToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

// Next.js 16 kompatibilitas untuk konvensi proxy/middleware
export { middleware as proxy }

export const config = {
  matcher: [
    '/admin/:path*',
    '/kasir/:path*',
    '/riwayat/:path*',
    '/profil/:path*',
    '/pesanan',
    '/login',
    '/register',
  ],
}
