import type { ReactNode } from 'react'

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  )
}
