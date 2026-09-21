'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition text-left mt-8 border-t border-gray-100"
    >
      <LogOut className="w-5 h-5" /> Logout
    </button>
  )
}
