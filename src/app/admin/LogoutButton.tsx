'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/lib/authActions'

export default function LogoutButton() {
  const handleLogout = async () => {
    const res = await logoutAction('admin')
    window.location.href = res.redirectTo || '/admin/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition text-left mt-8 border-t border-gray-100 cursor-pointer"
    >
      <LogOut className="w-5 h-5" /> Logout
    </button>
  )
}
