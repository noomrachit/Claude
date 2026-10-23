import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import type { Card } from '@/types'

interface Actions {
  onRename: (title: string) => void
  onDelete: () => void
}

interface Props extends Actions {
  card: Card
  canEdit: boolean
}

const tileClass =
  'rounded-md border border-slate-200 bg-white p-2 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-700'

/** Static look of a card; also used inside the DragOverlay. */
export function CardView({ card }: { card: Card }) {
  return <div className={`${tileClass} break-words`}>{card.title}</div>
}

export function CardTile({ card, canEdit, onRename, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
    disabled: !canEdit,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.title)
  const [confirming, setConfirming] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (trimmed && trimmed !== card.title) onRename(trimmed)
    setEditing(false)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
      {...attributes}
      {...(editing ? {} : listeners)}
    >
      <div className={`${tileClass} group flex items-start gap-1 ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        {editing ? (
          <form onSubmit={submit} className="flex-1">
            <input
              autoFocus
              className={`${inputClass} py-1`}
              value={draft}
              maxLength={500}
              aria-label={t.cards.edit}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={submit}
              onKeyDown={(e) => e.key === 'Escape' && (setDraft(card.title), setEditing(false))}
            />
          </form>
        ) : (
          <span className="flex-1 break-words">{card.title}</span>
        )}
        {canEdit && !editing && (
          <span className="flex shrink-0 gap-1 text-slate-400">
            <button type="button" aria-label={t.cards.edit} className="px-1 hover:text-slate-900 dark:hover:text-white" onClick={() => { setDraft(card.title); setEditing(true) }}>✎</button>
            <button type="button" aria-label={t.common.delete} className="px-1 hover:text-red-600" onClick={() => setConfirming(true)}>✕</button>
          </span>
        )}
      </div>
      {confirming && (
        <ConfirmDialog
          title={t.cards.deleteTitle}
          message={t.cards.deleteBody(card.title)}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onDelete() }}
        />
      )}
    </li>
  )
}
