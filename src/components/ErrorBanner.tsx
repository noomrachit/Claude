import { t } from '@/lib/strings'

export function ErrorBanner({ message = t.errorGeneric, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded border border-current px-2 py-0.5">
          {t.retry}
        </button>
      )}
    </div>
  )
}
