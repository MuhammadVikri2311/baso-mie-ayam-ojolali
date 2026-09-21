import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Default export uses withAuth
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const path = req.nextUrl.pathname

    // Admin routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Kasir routes
    if (path.startsWith('/kasir') && token?.role !== 'KASIR') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Pelanggan routes (though everyone can access some, we only protect some if needed)
    // The matcher will catch them and ensure they are authenticated
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/kasir/:path*',
    '/pelanggan/:path*',
    '/keranjang',
    '/checkout',
    '/pesanan',
    '/riwayat',
    '/ai',
    '/profil',
  ],
}
