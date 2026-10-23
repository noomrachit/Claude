import { useState, type FormEvent } from 'react'
import { btnClass, btnPrimaryClass, inputClass } from './ui'
import { t } from '@/lib/strings'

interface Props {
  label: string
  placeholder: string
  onAdd: (title: string) => void
}

/** "+ label" button that expands into a one-line add form; stays open for quick successive adds. */
export function AddItemForm({ label, placeholder, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btnClass} w-full text-left`}>
        + {label}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        autoFocus
        className={inputClass}
        value={title}
        maxLength={500}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      <div className="flex gap-2">
        <button type="submit" className={btnPrimaryClass}>{label}</button>
        <button type="button" className={btnClass} onClick={() => { setOpen(false); setTitle('') }}>{t.common.cancel}</button>
      </div>
    </form>
  )
}
