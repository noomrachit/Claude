import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</h3>
      {children}
    </section>
  )
}
