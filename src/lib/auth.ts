import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcrypt'

export type PortalType = 'pelanggan' | 'kasir' | 'admin'

export function createAuthOptions(portal: PortalType): NextAuthOptions {
  const cookiePrefix = `ojolali-${portal}`
  const isProd = process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https')

  return {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 hari
    },
    pages: {
      signIn: portal === 'admin' ? '/admin/login' : portal === 'kasir' ? '/kasir/login' : '/login',
    },
    cookies: {
      sessionToken: {
        name: `${cookiePrefix}.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: Boolean(isProd),
        },
      },
      callbackUrl: {
        name: `${cookiePrefix}.callback-url`,
        options: {
          sameSite: 'lax',
          path: '/',
          secure: Boolean(isProd),
        },
      },
      csrfToken: {
        name: `${cookiePrefix}.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: Boolean(isProd),
        },
      },
    },
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const normalizedEmail = credentials.email.trim().toLowerCase()

          const user = await db.user.findUnique({
            where: {
              email: normalizedEmail,
            },
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Validasi hak akses sesuai portal:
          if (portal === 'admin' && user.role !== 'ADMIN') {
            return null
          }
          if (portal === 'kasir' && user.role !== 'KASIR' && user.role !== 'ADMIN') {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.role = user.role
        } else if (token?.id) {
          // Sinkronkan role terkini dari database
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        }
        return token
      },
      async session({ session, token }) {
        if (token) {
          session.user.id = token.id as string
          session.user.role = token.role as string
        }
        return session
      },
    },
  }
}

export const customerAuthOptions = createAuthOptions('pelanggan')
export const kasirAuthOptions = createAuthOptions('kasir')
export const adminAuthOptions = createAuthOptions('admin')

// Export default authOptions untuk kompatibilitas umum pelanggan
export const authOptions = customerAuthOptions

export async function getCustomerSession() {
  return await getServerSession(customerAuthOptions)
}

export async function getKasirSession() {
  return await getServerSession(kasirAuthOptions)
}

export async function getAdminSession() {
  return await getServerSession(adminAuthOptions)
}

export async function getStaffSession() {
  const kasir = await getServerSession(kasirAuthOptions)
  if (kasir?.user) return kasir
  const admin = await getServerSession(adminAuthOptions)
  if (admin?.user) return admin
  return null
}

export async function getSessionForPortal(portalContext?: 'admin' | 'kasir' | 'pelanggan' | string | null) {
  if (portalContext === 'admin') {
    const admin = await getServerSession(adminAuthOptions)
    if (admin?.user && admin.user.role === 'ADMIN') return admin
    return null
  }
  if (portalContext === 'kasir') {
    const kasir = await getServerSession(kasirAuthOptions)
    if (kasir?.user && (kasir.user.role === 'KASIR' || kasir.user.role === 'ADMIN')) return kasir
    return null
  }
  if (portalContext === 'pelanggan') {
    const pelanggan = await getServerSession(customerAuthOptions)
    if (pelanggan?.user && pelanggan.user.role === 'PELANGGAN') return pelanggan
    return null
  }

  // Jika portalContext tidak spesifik, verifikasi sesuai urutan customer -> kasir -> admin
  // JANGAN mengecek admin pertama agar sesi admin tidak membajak halaman kasir atau pelanggan
  const pelanggan = await getServerSession(customerAuthOptions)
  if (pelanggan?.user) return pelanggan
  const kasir = await getServerSession(kasirAuthOptions)
  if (kasir?.user) return kasir
  const admin = await getServerSession(adminAuthOptions)
  if (admin?.user) return admin
  return null
}

export async function getAnySession(portalContext?: 'admin' | 'kasir' | 'pelanggan' | string | null) {
  return await getSessionForPortal(portalContext)
}

/**
 * Resolusi Sesi Server Terisolasi & Anti-Spoofing:
 * Mengambil sesi autentikasi server yang sesuai konteks portal/path tanpa fallback asumsi ke ADMIN.
 * Mencegah cookie sesi Admin membajak portal Kasir atau Pelanggan.
 */
export async function resolveAuthenticatedUserSession(
  portalContext?: string | null,
  currentPath?: string | null
) {
  let normalizedPortal: 'admin' | 'kasir' | 'pelanggan' | undefined = undefined
  const p = (portalContext || '').toLowerCase().trim()
  const path = (currentPath || '').toLowerCase().trim()

  if (p === 'admin' || path.startsWith('/admin')) {
    normalizedPortal = 'admin'
  } else if (p === 'kasir' || path.startsWith('/kasir')) {
    normalizedPortal = 'kasir'
  } else if (
    p === 'pelanggan' ||
    path === '/' ||
    path.startsWith('/menu') ||
    path.startsWith('/pesanan') ||
    path.startsWith('/profil') ||
    path.startsWith('/checkout') ||
    path.startsWith('/keranjang') ||
    path.startsWith('/riwayat')
  ) {
    normalizedPortal = 'pelanggan'
  }

  // 1. Jika konteks portal adalah Admin (/admin)
  if (normalizedPortal === 'admin') {
    const admin = await getServerSession(adminAuthOptions).catch(() => null)
    if (admin?.user?.id) return admin
    return null
  }

  // 2. Jika konteks portal adalah Kasir (/kasir)
  if (normalizedPortal === 'kasir') {
    const kasir = await getServerSession(kasirAuthOptions).catch(() => null)
    if (kasir?.user?.id) return kasir
    const admin = await getServerSession(adminAuthOptions).catch(() => null)
    if (admin?.user?.id) return admin
    return null
  }

  // 3. Jika konteks portal adalah Pelanggan (halaman publik/menu/checkout)
  if (normalizedPortal === 'pelanggan') {
    const pelanggan = await getServerSession(customerAuthOptions).catch(() => null)
    if (pelanggan?.user?.id) return pelanggan
    const kasir = await getServerSession(kasirAuthOptions).catch(() => null)
    if (kasir?.user?.id) return kasir
    const admin = await getServerSession(adminAuthOptions).catch(() => null)
    if (admin?.user?.id) return admin
    return null
  }

  // 4. Jika tidak ada konteks portal/path eksplisit (misal API request generic tanpa portal):
  // Verifikasi berurutan dengan prioritas Pelanggan -> Kasir -> Admin (JANGAN utamakan Admin!)
  const customerSession = await getServerSession(customerAuthOptions).catch(() => null)
  if (customerSession?.user?.id) {
    return customerSession
  }

  const kasirSession = await getServerSession(kasirAuthOptions).catch(() => null)
  if (kasirSession?.user?.id) {
    return kasirSession
  }

  const adminSession = await getServerSession(adminAuthOptions).catch(() => null)
  if (adminSession?.user?.id) {
    return adminSession
  }

  // Jika tetap ada sesi pelanggan meskipun role bukan PELANGGAN
  if (customerSession?.user?.id) return customerSession
  if (kasirSession?.user?.id) return kasirSession
  if (adminSession?.user?.id) return adminSession

  return null
}
