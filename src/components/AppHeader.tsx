import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { btnClass } from '@/components/ui'
import { useAuth } from '@/features/auth/useAuth'
import { t } from '@/lib/strings'

export function AppHeader({ children }: { children?: ReactNode }) {
  const { user, signOut } = useAuth()
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="font-semibold">{t.appName}</Link>
        {children}
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden max-w-48 truncate text-sm text-slate-500 sm:inline">{user?.email}</span>
        <ThemeToggle />
        <button type="button" onClick={signOut} className={btnClass}>{t.auth.logout}</button>
      </div>
    </header>
  )
}
