import { describe, expect, it } from 'vitest'
import { t } from '@/lib/strings'
import { authErrorMessage, validateCredentials } from './authErrors'

describe('validateCredentials', () => {
  it('accepts a valid pair', () => {
    expect(validateCredentials('a@b.co', 'longenough')).toBeNull()
  })
  it('rejects empty, malformed email and short password', () => {
    expect(validateCredentials('  ', 'longenough')).toBe(t.auth.errors.emailRequired)
    expect(validateCredentials('nope', 'longenough')).toBe(t.auth.errors.emailInvalid)
    expect(validateCredentials('a@b.co', '1234567')).toBe(t.auth.errors.passwordShort)
  })
})

describe('authErrorMessage', () => {
  it('maps known codes', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe(t.auth.errors.invalidCredentials)
    expect(authErrorMessage({ code: 'user_already_exists' })).toBe(t.auth.errors.alreadyRegistered)
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toBe(t.auth.errors.rateLimited)
  })
  it('detects network failures and falls back to a generic message', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toBe(t.auth.errors.network)
    expect(authErrorMessage({ code: 'weird' })).toBe(t.errorGeneric)
  })
})
