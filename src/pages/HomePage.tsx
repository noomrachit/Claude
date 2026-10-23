import { ThemeToggle } from '@/components/ThemeToggle'
import { ErrorBanner } from '@/components/ErrorBanner'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { t } from '@/lib/strings'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.appName}</h1>
        <ThemeToggle />
      </header>
      {!isSupabaseConfigured && <ErrorBanner message={`${t.setupTitle} — ${t.setupHint}`} />}
    </main>
  )
}
