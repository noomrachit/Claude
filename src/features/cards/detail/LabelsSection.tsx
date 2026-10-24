import { useState, type FormEvent } from 'react'
import { btnClass, btnPrimaryClass, inputClass } from '@/components/ui'
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
  onUpdate: (labelId: string, name: string, color: string) => void
  onDelete: (labelId: string) => void
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={t.detail.labels}>
      {LABEL_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={`size-5 rounded-full ${value === c ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function LabelEditor({ label, onSave, onCancel }: { label: Label; onSave: (name: string, color: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)
  function submit(e: FormEvent) {
    e.preventDefault()
    onSave(name.trim(), color)
  }
  return (
    <form onSubmit={submit} className="flex w-full flex-wrap items-center gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-600">
      <input autoFocus className={`${inputClass} min-w-0 flex-1`} value={name} maxLength={100} aria-label={t.detail.newLabelName} placeholder={t.detail.newLabelName} onChange={(e) => setName(e.target.value)} />
      <ColorPicker value={color} onChange={setColor} />
      <button type="submit" className={btnPrimaryClass}>{t.detail.saveLabel}</button>
      <button type="button" className={btnClass} onClick={onCancel}>{t.common.cancel}</button>
    </form>
  )
}

export function LabelsSection({ labels, selected, canEdit, onToggle, onCreate, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(LABEL_COLORS[5])
  const [editingId, setEditingId] = useState<string | null>(null)

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
          if (editingId === l.id) {
            return <LabelEditor key={l.id} label={l} onCancel={() => setEditingId(null)} onSave={(n, c) => { onUpdate(l.id, n, c); setEditingId(null) }} />
          }
          const on = selected.has(l.id)
          return (
            <span key={l.id} className="inline-flex items-center">
              <button
                type="button"
                disabled={!canEdit}
                aria-pressed={on}
                onClick={() => onToggle(l.id, !on)}
                className={`inline-flex min-w-12 items-center justify-center px-3 py-1 text-xs font-medium text-white ${canEdit ? 'rounded-l-full' : 'rounded-full'} ${on ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white' : 'opacity-60'}`}
                style={{ backgroundColor: l.color }}
              >
                {l.name || ' '}
              </button>
              {canEdit && (
                <>
                  <button
                    type="button"
                    aria-label={`${t.detail.editLabel}: ${l.name || l.color}`}
                    title={t.detail.editLabel}
                    onClick={() => setEditingId(l.id)}
                    className="border border-l-0 border-slate-300 px-1.5 py-1 text-xs text-slate-500 hover:text-slate-900 dark:border-slate-600 dark:hover:text-white"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label={`${t.detail.deleteLabel}: ${l.name || l.color}`}
                    title={t.detail.deleteLabel}
                    onClick={() => onDelete(l.id)}
                    className="rounded-r-full border border-l-0 border-slate-300 px-1.5 py-1 text-xs text-slate-500 hover:text-red-600 dark:border-slate-600"
                  >
                    ✕
                  </button>
                </>
              )}
            </span>
          )
        })}
      </div>
      {canEdit && (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <input className={`${inputClass} min-w-0 flex-1`} value={name} maxLength={100} placeholder={t.detail.newLabelName} aria-label={t.detail.newLabelName} onChange={(e) => setName(e.target.value)} />
          <ColorPicker value={color} onChange={setColor} />
          <button type="submit" className={btnPrimaryClass}>{t.detail.addLabel}</button>
        </form>
      )}
    </Section>
  )
}
