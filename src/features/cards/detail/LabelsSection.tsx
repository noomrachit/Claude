import { useState, type FormEvent } from 'react'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import type { Label } from '@/types'
import { LABEL_COLORS } from './labelColors'
import { Section } from './Section'

interface Props {
  labels: Label[]
  selected: Set<string>
  canEdit: boolean
  onToggle: (labelId: string, on: boolean) => void
  onCreate: (name: string, color: string) => void
  onDelete: (labelId: string) => void
}

export function LabelsSection({ labels, selected, canEdit, onToggle, onCreate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(LABEL_COLORS[5])

  function submit(e: FormEvent) {
    e.preventDefault()
    onCreate(name.trim(), color)
    setName('')
  }

  return (
    <Section title={t.detail.labels}>
      {labels.length === 0 && <p className="text-xs text-slate-500">{t.detail.noLabels}</p>}
      <div className="flex flex-wrap gap-2">
        {labels.map((l) => {
          const on = selected.has(l.id)
          return (
            <span key={l.id} className="inline-flex items-center">
              <button
                type="button"
                disabled={!canEdit}
                aria-pressed={on}
                onClick={() => onToggle(l.id, !on)}
                className={`inline-flex min-w-12 items-center justify-center rounded-l-full px-3 py-1 text-xs font-medium text-white ${on ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white' : 'opacity-60'}`}
                style={{ backgroundColor: l.color }}
              >
                {l.name || ' '}
              </button>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`${t.detail.deleteLabel}: ${l.name || l.color}`}
                  title={t.detail.deleteLabel}
                  onClick={() => onDelete(l.id)}
                  className="rounded-r-full border border-l-0 border-slate-300 px-1.5 py-1 text-xs text-slate-500 hover:text-red-600 dark:border-slate-600"
                >
                  ✕
                </button>
              )}
            </span>
          )
        })}
      </div>
      {canEdit && (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <input className={`${inputClass} min-w-0 flex-1`} value={name} maxLength={100} placeholder={t.detail.newLabelName} aria-label={t.detail.newLabelName} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-1" role="radiogroup" aria-label={t.detail.labels}>
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={`size-5 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" className={btnPrimaryClass}>{t.detail.addLabel}</button>
        </form>
      )}
    </Section>
  )
}

