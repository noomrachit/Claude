import { useTheme } from '@/hooks/useTheme'
import { t } from '@/lib/strings'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? t.theme.light : t.theme.dark}
    </button>
  )
}
