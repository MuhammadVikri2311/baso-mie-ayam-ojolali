'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/auth'

export async function addProduct(data: {
  name: string
  price: number
  categoryId: string
  description?: string
  image?: string
}) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola menu.' }
    }

    const trimmedName = data.name.trim()
    if (!trimmedName) {
      return { error: 'Nama menu tidak boleh kosong.' }
    }
    if (data.price < 0) {
      return { error: 'Harga menu tidak valid.' }
    }
    if (!data.categoryId) {
      return { error: 'Kategori wajib dipilih.' }
    }

    await db.product.create({
      data: {
        name: trimmedName,
        price: data.price,
        categoryId: data.categoryId,
        description: data.description?.trim() || '',
        image: data.image?.trim() || '/images/menu/baso-original.jpg',
        isAvailable: true,
      }
    })

    try {
      revalidatePath('/admin/menu')
      revalidatePath('/admin/kategori')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambahkan menu'
    return { error: msg }
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string
    price: number
    categoryId: string
    description?: string
    image?: string
    isAvailable?: boolean
  }
) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola menu.' }
    }

    const trimmedName = data.name.trim()
    if (!trimmedName) {
      return { error: 'Nama menu tidak boleh kosong.' }
    }
    if (data.price < 0) {
      return { error: 'Harga menu tidak valid.' }
    }

    await db.product.update({
      where: { id },
      data: {
        name: trimmedName,
        price: data.price,
        categoryId: data.categoryId,
        description: data.description?.trim() || '',
        ...(data.image ? { image: data.image.trim() } : {}),
        ...(typeof data.isAvailable === 'boolean' ? { isAvailable: data.isAvailable } : {}),
      }
    })

    try {
      revalidatePath('/admin/menu')
      revalidatePath('/admin/kategori')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui menu'
    return { error: msg }
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengelola menu.' }
    }

    // Periksa riwayat pesanan
    const orderItemCount = await db.orderItem.count({ where: { productId: id } })
    if (orderItemCount > 0) {
      return {
        error: `Menu ini tidak dapat dihapus permanen karena tercatat dalam ${orderItemCount} riwayat pesanan. Anda dapat menonaktifkan statusnya menjadi "Habis" agar tidak muncul di katalog pelanggan.`
      }
    }

    await db.product.delete({ where: { id } })

    try {
      revalidatePath('/admin/menu')
      revalidatePath('/admin/kategori')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus menu'
    return { error: msg }
  }
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  try {
    const session = await getAdminSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { error: 'Akses ditolak: Hanya Administrator yang diizinkan mengubah status.' }
    }

    await db.product.update({
      where: { id },
      data: { isAvailable }
    })

    try {
      revalidatePath('/admin/menu')
      revalidatePath('/menu')
      revalidatePath('/')
    } catch {
      // Safe revalidate
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengubah status ketersediaan'
    return { error: msg }
  }
}
