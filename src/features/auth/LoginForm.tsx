import { useState, type FormEvent } from 'react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { t } from '@/lib/strings'
import { MIN_PASSWORD_LENGTH, validateCredentials } from './authErrors'
import { useAuth } from './useAuth'

type Mode = 'login' | 'signup' | 'forgot'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'

export function LoginForm() {
  const { signInWithPassword, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const goTo = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    const invalid = mode === 'forgot' ? validateCredentials(email, 'x'.repeat(MIN_PASSWORD_LENGTH)) : validateCredentials(email, password)
    if (invalid) return setError(invalid)

    setBusy(true)
    try {
      if (mode === 'forgot') {
        const message = await resetPassword(email)
        if (message) setError(message)
        else setNotice(t.auth.resetSent)
      } else if (mode === 'login') {
        setError(await signInWithPassword(email, password))
      } else {
        const res = await signUp(email, password, displayName)
        if (res.error) setError(res.error)
        else if (res.needsConfirmation) setNotice(t.auth.checkEmail)
      }
    } catch {
      setError(t.auth.errors.network)
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setBusy(true)
    try {
      const message = await signInWithGoogle()
      if (message) setError(message)
    } catch {
      setError(t.auth.errors.network)
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || !isSupabaseConfigured

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{mode === 'login' ? t.auth.login : mode === 'signup' ? t.auth.signup : t.auth.forgotTitle}</h1>

      {!isSupabaseConfigured && <ErrorBanner message={`${t.setupTitle} — ${t.setupHint}`} />}
      {error && <ErrorBanner message={error} />}
      {notice && (
        <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {notice}
        </p>
      )}

      {mode === 'signup' && (
        <label className="block space-y-1 text-sm">
          <span>{t.auth.displayName}</span>
          <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
        </label>
      )}
      <label className="block space-y-1 text-sm">
        <span>{t.auth.email}</span>
        <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      {mode !== 'forgot' && (
      <label className="block space-y-1 text-sm">
        <span>{t.auth.password}</span>
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
      </label>
      )}
      {mode === 'login' && (
        <button type="button" onClick={() => goTo('forgot')} className="text-sm text-blue-600 hover:underline">
          {t.auth.forgot}
        </button>
      )}

      <button type="submit" disabled={disabled} className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? t.loading : mode === 'login' ? t.auth.login : mode === 'signup' ? t.auth.signup : t.auth.sendReset}
      </button>

      {mode !== 'forgot' && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <hr className="flex-1 border-slate-300 dark:border-slate-700" />
            {t.auth.or}
            <hr className="flex-1 border-slate-300 dark:border-slate-700" />
          </div>

          <button type="button" onClick={onGoogle} disabled={disabled} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">
            {t.auth.google}
          </button>
        </>
      )}

      <button type="button" onClick={() => goTo(mode === 'login' ? 'signup' : 'login')} className="w-full text-center text-sm text-blue-600 hover:underline">
        {mode === 'login' ? t.auth.noAccount : mode === 'signup' ? t.auth.haveAccount : t.auth.backToLogin}
      </button>
    </form>
  )
}
