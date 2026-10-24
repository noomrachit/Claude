import { useEffect, useState } from 'react'
import { btnClass, chipClass, inputClass } from '@/components/ui'
import type { MemberOption } from '@/features/cards/detail/AssigneesSection'
import { t } from '@/lib/strings'
import type { Label } from '@/types'
import { isFiltering, NO_ASSIGNEE, type Filters } from './filterCards'

interface Props {
  filters: Filters
  labels: Label[]
  members: MemberOption[]
  /** Number of matching cards while filtering. */
  matchCount: number | null
  onChange: (next: Filters) => void
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export function FilterBar({ filters, labels, members, matchCount, onChange }: Props) {
  // Typing is debounced into the URL so every keystroke does not rewrite history.
  const [text, setText] = useState(filters.q)
  useEffect(() => {
    if (text === filters.q) return
    const id = setTimeout(() => onChange({ ...filters, q: text }), 250)
    return () => clearTimeout(id)
  }, [text, filters, onChange])

  // Follow external changes (back button, "clear").
  const [seenQ, setSeenQ] = useState(filters.q)
  if (filters.q !== seenQ) {
    setSeenQ(filters.q)
    setText(filters.q)
  }

  const active = isFiltering(filters) || text !== ''
  // On narrow screens the chip rows fold behind a toggle; on sm+ they are always visible.
  const [open, setOpen] = useState(false)
  const chipCount = filters.labelIds.length + filters.assigneeIds.length

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          className={`${inputClass} min-w-0 flex-1 sm:max-w-xs`}
          value={text}
          placeholder={t.filters.search}
          aria-label={t.filters.search}
          onChange={(e) => setText(e.target.value)}
        />
        {(labels.length > 0 || members.length > 0) && (
          <button type="button" className={`${btnClass} sm:hidden`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {t.filters.toggle}{chipCount > 0 ? ` (${chipCount})` : ''}
          </button>
        )}
        {active && (
          <button type="button" className={btnClass} onClick={() => { setText(''); onChange({ q: '', labelIds: [], assigneeIds: [] }) }}>
            {t.filters.clear}
          </button>
        )}
        {matchCount !== null && <span role="status" className="text-sm text-slate-500">{t.filters.count(matchCount)}</span>}
      </div>

      <div className={`space-y-2 ${open ? '' : 'hidden sm:block'}`}>
      {labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.filters.labels}>
          <span className="text-xs text-slate-500">{t.filters.labels}</span>
          {labels.map((l) => {
            const on = filters.labelIds.includes(l.id)
            return (
              <button key={l.id} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, labelIds: toggle(filters.labelIds, l.id) })} className={chipClass(on)}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name || l.color}
              </button>
            )
          })}
        </div>
      )}

      {members.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.filters.assignees}>
          <span className="text-xs text-slate-500">{t.filters.assignees}</span>
          {members.map((m) => {
            const on = filters.assigneeIds.includes(m.id)
            return (
              <button key={m.id} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, assigneeIds: toggle(filters.assigneeIds, m.id) })} className={chipClass(on)}>
                {m.name}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={filters.assigneeIds.includes(NO_ASSIGNEE)}
            onClick={() => onChange({ ...filters, assigneeIds: toggle(filters.assigneeIds, NO_ASSIGNEE) })}
            className={chipClass(filters.assigneeIds.includes(NO_ASSIGNEE))}
          >
            {t.filters.noAssignee}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
