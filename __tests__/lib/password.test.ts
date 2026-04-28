import { validatePassword } from '@/lib/password'

describe('validatePassword', () => {
  // --- Happy path ---
  describe('valid passwords', () => {
    it('accepts a password meeting all requirements', () => {
      const result = validatePassword('Abcd1!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts a 12-character password at the upper length boundary', () => {
      const result = validatePassword('Abcdef1!2345')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts a 6-character password at the lower length boundary', () => {
      const result = validatePassword('Aa1!bc')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts passwords with various special symbols', () => {
      const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', '\'', ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?', '`', '~']
      for (const sym of specials) {
        const pw = `Aa1${sym}xx`
        const result = validatePassword(pw)
        expect(result.valid).toBe(true)
      }
    })
  })

  // --- Length boundary failures ---
  describe('length validation', () => {
    it('rejects a password shorter than 6 characters', () => {
      const result = validatePassword('Aa1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密碼長度需為 6-12 個字元')
    })

    it('rejects an empty password', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密碼長度需為 6-12 個字元')
    })

    it('rejects a password of exactly 5 characters', () => {
      const result = validatePassword('Aa1!b')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密碼長度需為 6-12 個字元')
    })

    it('rejects a password longer than 12 characters', () => {
      const result = validatePassword('Abcdef1!23456')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密碼長度需為 6-12 個字元')
    })

    it('rejects a password of exactly 13 characters', () => {
      const result = validatePassword('Abcdef1!23456')
      expect(result.valid).toBe(false)
    })
  })

  // --- Character class failures ---
  describe('character class validation', () => {
    it('rejects a password missing uppercase letter', () => {
      const result = validatePassword('abcd1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('需包含至少一個大寫英文字母')
    })

    it('rejects a password missing lowercase letter', () => {
      const result = validatePassword('ABCD1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('需包含至少一個小寫英文字母')
    })

    it('rejects a password missing digit', () => {
      const result = validatePassword('Abcde!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('需包含至少一個數字')
    })

    it('rejects a password missing special symbol', () => {
      const result = validatePassword('Abcd12')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('需包含至少一個特殊符號')
    })
  })

  // --- Multiple errors accumulated ---
  describe('multiple validation errors', () => {
    it('returns all errors when password fails every rule', () => {
      // 'a' — too short, no uppercase, no digit, no special symbol
      const result = validatePassword('a')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('密碼長度需為 6-12 個字元')
      expect(result.errors).toContain('需包含至少一個大寫英文字母')
      expect(result.errors).toContain('需包含至少一個數字')
      expect(result.errors).toContain('需包含至少一個特殊符號')
    })

    it('returns multiple errors for a password missing two character classes', () => {
      // Missing uppercase and special symbol
      const result = validatePassword('abcd12')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('需包含至少一個大寫英文字母')
      expect(result.errors).toContain('需包含至少一個特殊符號')
    })
  })

  // --- Return shape ---
  describe('return shape', () => {
    it('always returns { valid, errors } object', () => {
      const result = validatePassword('Aa1!xx')
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('errors array is empty when valid', () => {
      const result = validatePassword('Aa1!xx')
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })
})
