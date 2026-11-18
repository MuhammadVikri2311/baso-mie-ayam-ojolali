'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const basePath = pathname?.startsWith('/admin')
    ? '/api/auth/admin'
    : pathname?.startsWith('/kasir')
    ? '/api/auth/kasir'
    : '/api/auth'

  return (
    <SessionProvider key={basePath} basePath={basePath}>
      {children}
    </SessionProvider>
  )
}
