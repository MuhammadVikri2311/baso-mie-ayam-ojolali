import { describe, it, expect } from 'vitest'
import { registerSchema } from '@/app/register/actions'
import { registerUserSchema } from '@/lib/validations'

describe('Unit Test: Validasi Registrasi Akun Pengguna (Zod)', () => {
  describe('registerSchema (src/app/register/actions.ts)', () => {
    it('harus menerima input registrasi yang valid', () => {
      const validData = {
        name: 'Budi Santoso',
        email: 'budi.santoso@gmail.com',
        password: 'password123',
        confirmPassword: 'password123',
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Budi Santoso')
        expect(result.data.email).toBe('budi.santoso@gmail.com')
      }
    })

    it('harus menerima password tepat pada batas minimal 8 karakter (edge case)', () => {
      const edgeCaseData = {
        name: 'Vikri',
        email: 'vikri@ojolali.com',
        password: '12345678', // Tepat 8 karakter
        confirmPassword: '12345678',
      }

      const result = registerSchema.safeParse(edgeCaseData)
      expect(result.success).toBe(true)
    })

    it('harus menolak nama yang kosong', () => {
      const invalidData = {
        name: '',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const nameError = result.error.issues.find((issue) => issue.path.includes('name'))
        expect(nameError?.message).toBe('Nama wajib diisi')
      }
    })

    it('harus menolak format email yang tidak valid', () => {
      const invalidEmails = [
        'bukan-email',
        'user@',
        '@domain.com',
        'user@domain',
        'user name@domain.com',
        '',
      ]

      for (const email of invalidEmails) {
        const result = registerSchema.safeParse({
          name: 'Pelanggan',
          email,
          password: 'password123',
          confirmPassword: 'password123',
        })
        expect(result.success).toBe(false)
      }
    })

    it('harus menolak password di bawah batas minimal (< 8 karakter)', () => {
      const shortPasswords = ['1234567', 'abc', 'p', '']

      for (const password of shortPasswords) {
        const result = registerSchema.safeParse({
          name: 'Pelanggan',
          email: 'pelanggan@ojolali.com',
          password,
          confirmPassword: password,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const passError = result.error.issues.find((issue) => issue.path.includes('password'))
          expect(passError?.message).toBe('Password minimal 8 karakter')
        }
      }
    })

    it('harus menolak ketika password dan confirmPassword tidak cocok', () => {
      const mismatchData = {
        name: 'Pelanggan',
        email: 'pelanggan@ojolali.com',
        password: 'passwordA123',
        confirmPassword: 'passwordB123',
      }

      const result = registerSchema.safeParse(mismatchData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const confirmError = result.error.issues.find((issue) =>
          issue.path.includes('confirmPassword')
        )
        expect(confirmError?.message).toBe('Konfirmasi password tidak cocok')
      }
    })

    it('harus membedakan huruf besar dan kecil pada password (case sensitivity)', () => {
      const caseMismatch = {
        name: 'Pelanggan',
        email: 'pelanggan@ojolali.com',
        password: 'Password123',
        confirmPassword: 'password123',
      }

      const result = registerSchema.safeParse(caseMismatch)
      expect(result.success).toBe(false)
    })
  })

  describe('registerUserSchema (src/lib/validations.ts)', () => {
    it('harus memotong spasi luar (trim) pada nama dan email', () => {
      const untrimmedData = {
        name: '   Sofi Prasyanti   ',
        email: '   sofi@ojolali.com   ',
        password: 'password123',
        confirmPassword: 'password123',
      }

      const result = registerUserSchema.safeParse(untrimmedData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Sofi Prasyanti')
        expect(result.data.email).toBe('sofi@ojolali.com')
      }
    })
  })
})

