import { EmptyState } from '@/components/EmptyState'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/features/auth/useAuth'
import { t } from '@/lib/strings'

export default function HomePage() {
  const { user, signOut } = useAuth()
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t.boards.title}</h1>
        <div className="flex items-center gap-2">
          <span className="max-w-40 truncate text-sm text-slate-500 sm:max-w-none">{user?.email}</span>
          <ThemeToggle />
          <button type="button" onClick={signOut} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
            {t.auth.logout}
          </button>
        </div>
      </header>
      <EmptyState title={t.boards.comingSoon} />
    </main>
  )
}
