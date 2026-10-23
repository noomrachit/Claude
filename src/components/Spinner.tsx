import { t } from '@/lib/strings'

export function Spinner({ label = t.loading }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-slate-500">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      {label}
    </div>
  )
}
