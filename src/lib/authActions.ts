'use server'

import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import { encode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

export type PortalType = 'admin' | 'kasir' | 'pelanggan'

export interface LoginResult {
  success: boolean
  error?: string
  redirectTo?: string
  role?: string
}

export async function loginAction(data: {
  email: string
  password: string
  expectedPortal?: PortalType
  callbackUrl?: string
}): Promise<LoginResult> {
  const { email, password, expectedPortal, callbackUrl } = data

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return { success: false, error: 'Email atau password salah.' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return { success: false, error: 'Email atau password salah.' }
    }

    // Validasi izin akses sesuai portal yang dituju (jika ada)
    if (expectedPortal === 'admin' && user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Akses ditolak: Akun Anda tidak memiliki hak akses Administrator.',
      }
    }

    if (expectedPortal === 'kasir' && user.role !== 'KASIR' && user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Akses ditolak: Akun Anda tidak memiliki hak akses Kasir.',
      }
    }

    const secret = process.env.NEXTAUTH_SECRET || 'rahasia-ojolali-2026-website'
    const maxAge = 30 * 24 * 60 * 60 // 30 hari

    const token = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    const encodedToken = await encode({
      token,
      secret,
      maxAge,
    })

    const isProd = process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https')
    const cookieStore = await cookies()
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure: Boolean(isProd),
      maxAge,
    }

    let redirectTo = '/'

    if (user.role === 'ADMIN') {
      // Set cookie khusus Admin & bersihkan cookie role lain agar sesi tidak bocor/tertukar
      cookieStore.set('ojolali-admin.session-token', encodedToken, cookieOptions)
      cookieStore.delete('ojolali-kasir.session-token')
      cookieStore.delete('ojolali-pelanggan.session-token')
      redirectTo = '/admin'
    } else if (user.role === 'KASIR') {
      // Set cookie khusus Kasir & bersihkan cookie role lain
      cookieStore.set('ojolali-kasir.session-token', encodedToken, cookieOptions)
      cookieStore.delete('ojolali-admin.session-token')
      cookieStore.delete('ojolali-pelanggan.session-token')
      redirectTo = '/kasir'
    } else {
      // Set cookie khusus Pelanggan & bersihkan cookie role staf
      cookieStore.set('ojolali-pelanggan.session-token', encodedToken, cookieOptions)
      cookieStore.delete('ojolali-admin.session-token')
      cookieStore.delete('ojolali-kasir.session-token')
      const isValidCallback =
        callbackUrl &&
        callbackUrl !== '/login' &&
        !callbackUrl.startsWith('/admin') &&
        !callbackUrl.startsWith('/kasir')
      redirectTo = isValidCallback ? callbackUrl : '/'
    }

    return {
      success: true,
      role: user.role,
      redirectTo,
    }
  } catch (err: unknown) {
    console.error('Error during loginAction:', err)
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat memproses login. Silakan coba lagi.',
    }
  }
}

export async function logoutAction(portal: PortalType): Promise<{ success: boolean; redirectTo: string }> {
  try {
    const cookieStore = await cookies()
    const cookieName = `ojolali-${portal}.session-token`
    cookieStore.delete(cookieName)
    cookieStore.delete(`ojolali-${portal}.csrf-token`)
    cookieStore.delete(`ojolali-${portal}.callback-url`)

    let redirectTo = '/login'
    if (portal === 'admin') {
      redirectTo = '/admin/login'
    } else if (portal === 'kasir') {
      redirectTo = '/kasir/login'
    }

    return { success: true, redirectTo }
  } catch (err) {
    console.error('Error during logoutAction:', err)
    return {
      success: true,
      redirectTo: portal === 'admin' ? '/admin/login' : portal === 'kasir' ? '/kasir/login' : '/login',
    }
  }
}
