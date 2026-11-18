import { describe, it, expect } from 'vitest'
import { isValidEmail, getEmailConfigStatus } from '@/lib/emailService'

describe('Unit Test: Validasi Email & Status Konfigurasi Provider (Email Service)', () => {
  describe('isValidEmail', () => {
    it('harus memvalidasi alamat email standar yang valid', () => {
      const validEmails = [
        'vikrim714@gmail.com',
        'admin@ojolali.com',
        'user.name+tag@domain.co.id',
        'pelanggan_123@sub.domain.org',
        'customer-care@ojolali.local',
      ]

      for (const email of validEmails) {
        expect(isValidEmail(email)).toBe(true)
      }
    })

    it('harus menolak input email kosong, null, atau undefined (kondisi batas)', () => {
      expect(isValidEmail(null)).toBe(false)
      expect(isValidEmail(undefined)).toBe(false)
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('   ')).toBe(false)
    })

    it('harus menolak email dengan format rusak atau tidak lengkap', () => {
      const invalidEmails = [
        'bukan-email',
        'user@',
        '@ojolali.com',
        'user@.com',
        'user@domain..com',
        'user name@domain.com',
        'user@domain,com',
      ]

      for (const email of invalidEmails) {
        expect(isValidEmail(email)).toBe(false)
      }
    })

    it('harus menolak email yang melebihi batas standar RFC 254 karakter (edge case)', () => {
      const tooLongEmail = 'a'.repeat(245) + '@domain.com' // > 254 karakter
      expect(isValidEmail(tooLongEmail)).toBe(false)
    })
  })

  describe('getEmailConfigStatus', () => {
    it('harus mengembalikan struktur status provider email dengan nilai default aman', () => {
      const status = getEmailConfigStatus()
      expect(status).toHaveProperty('resend')
      expect(status).toHaveProperty('gmail')
      expect(status).toHaveProperty('activeProvider')
      expect(['resend', 'gmail', 'none']).toContain(status.activeProvider)
    })
  })
})

