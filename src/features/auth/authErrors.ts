import { t } from '@/lib/strings'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD_LENGTH = 8

export function validateCredentials(email: string, password: string): string | null {
  if (!email.trim()) return t.auth.errors.emailRequired
  if (!EMAIL_RE.test(email.trim())) return t.auth.errors.emailInvalid
  if (password.length < MIN_PASSWORD_LENGTH) return t.auth.errors.passwordShort
  return null
}

interface AuthErrorLike {
  code?: string
  message?: string
  status?: number
}

/** Maps a Supabase auth error to a Thai message shown to the user. */
export function authErrorMessage(error: AuthErrorLike): string {
  const e = t.auth.errors
  switch (error.code) {
    case 'invalid_credentials':
      return e.invalidCredentials
    case 'email_not_confirmed':
      return e.emailNotConfirmed
    case 'user_already_exists':
    case 'email_exists':
      return e.alreadyRegistered
    case 'weak_password':
      return e.weakPassword
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return e.rateLimited
  }
  if (error.status === 0 || /fetch|network/i.test(error.message ?? '')) return e.network
  return t.errorGeneric
}
