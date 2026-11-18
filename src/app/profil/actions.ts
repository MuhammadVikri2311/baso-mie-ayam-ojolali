'use server'

import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  
  if (!name || name.trim() === '') {
    return { error: 'Nama tidak boleh kosong' }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() }
    })
    
    return { success: true }
  } catch {
    return { error: 'Gagal memperbarui profil' }
  }
}
