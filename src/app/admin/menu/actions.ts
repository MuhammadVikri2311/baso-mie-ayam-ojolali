'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function addProduct(data: { name: string; price: number; categoryId: string; description?: string }) {
  try {
    await db.product.create({
      data: {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        description: data.description || '',
      }
    })
    revalidatePath('/admin/menu')
    revalidatePath('/menu')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Gagal menambahkan menu' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.product.delete({ where: { id } })
    revalidatePath('/admin/menu')
    revalidatePath('/menu')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Gagal menghapus menu' }
  }
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  try {
    await db.product.update({
      where: { id },
      data: { isAvailable }
    })
    revalidatePath('/admin/menu')
    revalidatePath('/menu')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Gagal mengubah status' }
  }
}
