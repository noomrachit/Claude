import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { dueStatus, formatDue } from '@/lib/dates'
import { t } from '@/lib/strings'
import type { Card } from '@/types'
import { EMPTY_META, type CardMeta } from './cardMeta'

const tileClass =
  'rounded-md border border-slate-200 bg-white p-2 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-700'

const dueClass = {
  overdue: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  today: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  later: 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200',
}

/** Title plus label bars and due/checklist/assignee badges. Also used inside the DragOverlay. */
function CardBody({ card, meta }: { card: Card; meta: CardMeta }) {
  const due = card.due_date ? dueStatus(card.due_date) : null
  const hasBadges = card.due_date || meta.checklistTotal > 0 || meta.assignees.length > 0
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      {meta.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.labels.map((l) => (
            <span key={l.id} title={l.name} className="h-2 w-8 rounded-full" style={{ backgroundColor: l.color }} />
          ))}
        </div>
      )}
      <p className="break-words">{card.title}</p>
      {hasBadges && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {card.due_date && due && <span className={`rounded px-1.5 py-0.5 ${dueClass[due]}`}>{formatDue(card.due_date)}</span>}
          {meta.checklistTotal > 0 && (
            <span className={`rounded px-1.5 py-0.5 ${meta.checklistDone === meta.checklistTotal ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200'}`}>
              ☑ {meta.checklistDone}/{meta.checklistTotal}
            </span>
          )}
          {meta.assignees.length > 0 && (
            <span className="ml-auto flex -space-x-1">
              {meta.assignees.map((a) => (
                <span key={a.id} title={a.name} className="grid size-5 place-items-center rounded-full bg-slate-300 text-[10px] font-medium text-slate-800 ring-1 ring-white dark:ring-slate-700">
                  {a.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function CardView({ card, meta = EMPTY_META }: { card: Card; meta?: CardMeta }) {
  return (
    <div className={`${tileClass} flex`}>
      <CardBody card={card} meta={meta} />
    </div>
  )
}

interface Props {
  card: Card
  meta: CardMeta
  canEdit: boolean
  dragEnabled: boolean
  onOpen: () => void
  onDelete: () => void
}

export function CardTile({ card, meta, canEdit, dragEnabled, onOpen, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
    disabled: !dragEnabled,
  })
  const [confirming, setConfirming] = useState(false)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
      {...attributes}
      {...listeners}
    >
      <div className={`${tileClass} flex items-start gap-1 ${dragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`} onClick={onOpen}>
        <CardBody card={card} meta={meta} />
        {canEdit && (
          <span className="flex shrink-0 gap-1 text-slate-400">
            <button type="button" aria-label={t.cards.edit} className="px-1 hover:text-slate-900 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); onOpen() }}>✎</button>
            <button type="button" aria-label={t.common.delete} className="px-1 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setConfirming(true) }}>✕</button>
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
