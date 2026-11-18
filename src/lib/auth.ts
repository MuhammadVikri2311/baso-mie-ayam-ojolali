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
