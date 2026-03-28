export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 6 || password.length > 12) {
    errors.push('密碼長度需為 6-12 個字元')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('需包含至少一個大寫英文字母')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('需包含至少一個小寫英文字母')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('需包含至少一個數字')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('需包含至少一個特殊符號')
  }

  return { valid: errors.length === 0, errors }
}
