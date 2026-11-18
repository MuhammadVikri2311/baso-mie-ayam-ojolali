'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import OrderNotificationBar from '@/components/notifications/OrderNotificationBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (pathname === '/admin/login') return

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.replace('/')
    }
  }, [pathname, status, session, router])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <OrderNotificationBar role="admin" />
        <main className="flex-1 bg-white rounded-2xl shadow-xs border border-stone-200/80 p-5 sm:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
