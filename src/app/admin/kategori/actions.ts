'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/auth'

export async function createCategory(data: { name: string; description?: string }) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola kategori.' }
    }

    const trimmedName = data.name.trim()
    if (!trimmedName) {
      return { error: 'Nama kategori wajib diisi.' }
    }

    // Periksa apakah nama kategori sudah ada
    const existing = await db.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    })

    if (existing) {
      return { error: `Kategori "${trimmedName}" sudah ada.` }
    }

    const category = await db.category.create({
      data: {
        name: trimmedName,
        description: data.description?.trim() || null
      }
    })

    try {
      revalidatePath('/admin/kategori')
      revalidatePath('/admin/menu')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Revalidate safe outside request
    }

    return { success: true, category }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal membuat kategori baru.'
    return { error: msg }
  }
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola kategori.' }
    }

    const trimmedName = data.name.trim()
    if (!trimmedName) {
      return { error: 'Nama kategori tidak boleh kosong.' }
    }

    // Periksa apakah kategori yang akan diedit ada
    const current = await db.category.findUnique({
      where: { id }
    })
    if (!current) {
      return { error: 'Kategori tidak ditemukan.' }
    }

    // Periksa nama duplikat dengan kategori lain
    const duplicate = await db.category.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    })

    if (duplicate) {
      return { error: `Kategori dengan nama "${trimmedName}" sudah digunakan.` }
    }

    await db.category.update({
      where: { id },
      data: {
        name: trimmedName,
        description: data.description?.trim() || null
      }
    })

    try {
      revalidatePath('/admin/kategori')
      revalidatePath('/admin/menu')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui kategori.'
    return { error: msg }
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola kategori.' }
    }

    // Keamanan: Cek apakah kategori masih dipakai oleh produk
    const productCount = await db.product.count({
      where: { categoryId: id }
    })

    if (productCount > 0) {
      return {
        error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk menu. Hapus atau pindahkan kategori produk tersebut terlebih dahulu.`
      }
    }

    await db.category.delete({
      where: { id }
    })

    try {
      revalidatePath('/admin/kategori')
      revalidatePath('/admin/menu')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus kategori.'
    return { error: msg }
  }
}
