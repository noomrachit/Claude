import { useState, type FormEvent } from 'react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { t } from '@/lib/strings'
import { validateCredentials } from './authErrors'
import { useAuth } from './useAuth'

type Mode = 'login' | 'signup'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'

export function LoginForm() {
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError(null)
    setNotice(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    const invalid = validateCredentials(email, password)
    if (invalid) return setError(invalid)

    setBusy(true)
    try {
      if (mode === 'login') {
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
      <h1 className="text-2xl font-semibold">{mode === 'login' ? t.auth.login : t.auth.signup}</h1>

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

      <button type="submit" disabled={disabled} className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? t.loading : mode === 'login' ? t.auth.login : t.auth.signup}
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
        {t.auth.or}
        <hr className="flex-1 border-slate-300 dark:border-slate-700" />
      </div>

      <button type="button" onClick={onGoogle} disabled={disabled} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">
        {t.auth.google}
      </button>

      <button type="button" onClick={switchMode} className="w-full text-center text-sm text-blue-600 hover:underline">
        {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}
      </button>
    </form>
  )
}
