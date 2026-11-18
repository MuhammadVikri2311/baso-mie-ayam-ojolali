import { z } from 'zod'

/**
 * Skema validasi pendaftaran akun pengguna baru (Zod)
 */
export const registerUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi'),
    email: z.string().trim().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

/**
 * Skema validasi item pesanan checkout
 */
export const orderItemInputSchema = z.object({
  id: z.string().min(1, 'ID produk wajib diisi'),
  quantity: z.number().int().min(1, 'Jumlah produk minimal 1'),
  noodleType: z.string().nullable().optional(),
  spiceLevel: z.string().nullable().optional(),
  notes: z.string().max(200, 'Catatan maksimal 200 karakter').nullable().optional(),
})

/**
 * Skema validasi form checkout pelanggan
 */
export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  customerEmail: z.string().trim().email('Format alamat email pelanggan tidak valid'),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)[0-9]{8,15}$/, 'Format nomor WhatsApp tidak valid')
    .nullable()
    .optional(),
  paymentMethod: z.enum(['CASH', 'QRIS', 'TRANSFER'], {
    error: 'Metode pembayaran tidak valid',
  }),
  items: z.array(orderItemInputSchema).min(1, 'Keranjang belanja tidak boleh kosong'),
})

/**
 * Skema validasi kategori produk oleh Admin
 */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(50, 'Nama kategori maksimal 50 karakter'),
  description: z.string().trim().max(255, 'Deskripsi maksimal 255 karakter').optional(),
})

/**
 * Skema validasi produk/menu baru oleh Admin
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama menu wajib diisi'),
  price: z.number().min(0, 'Harga menu tidak boleh negatif'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  description: z.string().trim().optional(),
  image: z.string().optional(),
})

