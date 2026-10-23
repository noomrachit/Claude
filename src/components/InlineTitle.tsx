import { useState } from 'react'
import { inputClass } from './ui'

interface Props {
  value: string
  canEdit: boolean
  onSave: (value: string) => void
  className?: string
}

/** Text that turns into an input on click (Enter/blur saves, Esc cancels). */
export function InlineTitle({ value, canEdit, onSave, className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function finish(save: boolean) {
    const trimmed = draft.trim()
    if (save && trimmed && trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  if (!canEdit) return <h3 className={`break-words ${className}`}>{value}</h3>

  if (editing) {
    return (
      <input
        autoFocus
        className={`${inputClass} py-1`}
        value={draft}
        maxLength={200}
        aria-label={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true)
          if (e.key === 'Escape') finish(false)
        }}
      />
    )
  }

  return (
    <h3 className={className}>
      <button type="button" className="w-full break-words text-left" onClick={() => { setDraft(value); setEditing(true) }}>
        {value}
      </button>
    </h3>
  )
}
