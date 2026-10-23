import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/Spinner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoginForm } from '@/features/auth/LoginForm'
import { useAuth } from '@/features/auth/useAuth'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'

  if (loading) return <Spinner />
  if (user) return <Navigate to={from} replace />

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <LoginForm />
    </main>
  )
}
