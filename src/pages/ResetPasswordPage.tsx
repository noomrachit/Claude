import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { validateNewPassword } from '@/features/auth/authErrors'
import { useAuth } from '@/features/auth/useAuth'
import { t } from '@/lib/strings'

/** Landing page of the password-reset email: the link signs the user in, then they pick a new password. */
export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const invalid = validateNewPassword(password, confirm)
    if (invalid) return setError(invalid)
    setError(null)
    setBusy(true)
    try {
      const message = await updatePassword(password)
      if (message) return setError(message)
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch {
      setError(t.auth.errors.network)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      {!user ? (
        <div className="w-full max-w-sm space-y-4">
          <ErrorBanner message={t.auth.resetLinkInvalid} />
          <Link to="/login" className="text-sm text-blue-600 hover:underline">{t.auth.backToLogin}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">{t.auth.forgotTitle}</h1>
          {error && <ErrorBanner message={error} />}
          {done && <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">{t.auth.passwordChanged}</p>}
          <label className="block space-y-1 text-sm">
            <span>{t.auth.newPassword}</span>
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t.auth.confirmPassword}</span>
            <input type="password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </label>
          <button type="submit" disabled={busy || done} className={`${btnPrimaryClass} w-full py-2`}>{busy ? t.loading : t.auth.savePassword}</button>
        </form>
      )}
    </main>
  )
}
