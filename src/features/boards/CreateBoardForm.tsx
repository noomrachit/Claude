import { useState, type FormEvent } from 'react'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import { useCreateBoard } from './hooks'

export function CreateBoardForm() {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = useCreateBoard()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return setError(t.boards.titleRequired)
    setError(null)
    create.mutate({ id: crypto.randomUUID(), title: trimmed }, { onError: () => setError(t.errorGeneric) })
    setTitle('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.boards.newPlaceholder}
          aria-label={t.boards.newPlaceholder}
        />
        <button type="submit" className={`${btnPrimaryClass} shrink-0`}>{t.common.create}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
