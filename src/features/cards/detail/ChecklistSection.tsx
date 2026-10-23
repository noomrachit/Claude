import { useState, type FormEvent } from 'react'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import type { ChecklistItem } from '@/types'
import { Section } from './Section'

interface Props {
  items: ChecklistItem[]
  canEdit: boolean
  onAdd: (content: string) => void
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export function ChecklistSection({ items, canEdit, onAdd, onToggle, onDelete }: Props) {
  const [text, setText] = useState('')
  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <Section title={items.length ? `${t.detail.checklist} (${done}/${items.length})` : t.detail.checklist}>
      {items.length > 0 && (
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={i.done} disabled={!canEdit} onChange={(e) => onToggle(i.id, e.target.checked)} aria-label={i.content} />
            <span className={`flex-1 break-words ${i.done ? 'text-slate-400 line-through' : ''}`}>{i.content}</span>
            {canEdit && <button type="button" aria-label={`${t.common.delete}: ${i.content}`} className="px-1 text-slate-400 hover:text-red-600" onClick={() => onDelete(i.id)}>✕</button>}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form onSubmit={submit} className="flex gap-2">
          <input className={inputClass} value={text} maxLength={500} placeholder={t.detail.checklistPlaceholder} aria-label={t.detail.checklistPlaceholder} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={btnPrimaryClass}>{t.common.create}</button>
        </form>
      )}
    </Section>
  )
}
