'use server'

import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
})

export async function registerUser(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  
  const validated = registerSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { name, email, password } = validated.data
  const normalizedEmail = email.trim().toLowerCase()

  try {
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return { error: 'Email sudah terdaftar.' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'PELANGGAN',
      },
    })

    return { success: true }
  } catch {
    return { error: 'Terjadi kesalahan pada server.' }
  }
}
