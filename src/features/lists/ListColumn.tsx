import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { AddItemForm } from '@/components/AddItemForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { InlineTitle } from '@/components/InlineTitle'
import { EMPTY_META, type CardMeta } from '@/features/cards/cardMeta'
import { CardTile } from '@/features/cards/CardTile'
import { t } from '@/lib/strings'
import type { Card, List } from '@/types'

export interface ListColumnProps {
  list: List
  cards: Card[]
  metaByCard: Map<string, CardMeta>
  canEdit: boolean
  /** Dragging is paused (e.g. while a filter hides some cards). */
  dragEnabled: boolean
  filtering: boolean
  onRename: (title: string) => void
  onDelete: () => void
  onAddCard: (title: string) => void
  onOpenCard: (cardId: string) => void
  onDeleteCard: (cardId: string) => void
}

const columnClass =
  'flex max-h-full w-72 shrink-0 flex-col gap-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-800'

/** Static look of a list header, used inside the DragOverlay while dragging a list. */
export function ListOverlay({ list, count }: { list: List; count: number }) {
  return (
    <div className={`${columnClass} shadow-lg`}>
      <p className="px-1 font-medium">{list.title} <span className="text-slate-500">({count})</span></p>
    </div>
  )
}

export function ListColumn({ list, cards, metaByCard, canEdit, dragEnabled, filtering, onRename, onDelete, onAddCard, onOpenCard, onDeleteCard }: ListColumnProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
    disabled: !dragEnabled,
  })
  const [confirming, setConfirming] = useState(false)

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${columnClass} ${isDragging ? 'opacity-40' : ''}`}
      aria-label={list.title}
    >
      <header className="flex items-start gap-1 px-1">
        {dragEnabled && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={t.lists.dragHandle}
            className="cursor-grab touch-none px-1 text-slate-400 hover:text-slate-700 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
        )}
        <InlineTitle value={list.title} canEdit={canEdit} onSave={onRename} className="flex-1 font-medium" />
        <span className="text-xs text-slate-500">{cards.length}</span>
        {canEdit && (
          <button type="button" aria-label={t.common.delete} className="px-1 text-slate-400 hover:text-red-600" onClick={() => setConfirming(true)}>✕</button>
        )}
      </header>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-10 flex-col gap-2 overflow-y-auto">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              meta={metaByCard.get(card.id) ?? EMPTY_META}
              canEdit={canEdit}
              dragEnabled={dragEnabled}
              onOpen={() => onOpenCard(card.id)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
          {cards.length === 0 && !filtering && <li className="px-1 py-2 text-center text-xs text-slate-400">{t.cards.empty}</li>}
        </ul>
      </SortableContext>

      {canEdit && <AddItemForm label={t.cards.add} placeholder={t.cards.titlePlaceholder} onAdd={onAddCard} />}

      {confirming && (
        <ConfirmDialog
          title={t.lists.deleteTitle}
          message={t.lists.deleteBody(list.title)}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onDelete() }}
        />
      )}
    </section>
  )
}
