import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, type FormEvent } from 'react'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { reorderedPosition } from '@/lib/position'
import { t } from '@/lib/strings'
import type { ChecklistItem } from '@/types'
import { Section } from './Section'

interface Props {
  items: ChecklistItem[]
  canEdit: boolean
  onAdd: (content: string) => void
  onToggle: (id: string, done: boolean) => void
  onRename: (id: string, content: string) => void
  onMove: (id: string, position: string) => void
  onDelete: (id: string) => void
}

interface RowProps {
  item: ChecklistItem
  canEdit: boolean
  onToggle: (done: boolean) => void
  onRename: (content: string) => void
  onDelete: () => void
}

function Row({ item, canEdit, onToggle, onRename, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !canEdit })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.content)

  function finish(save: boolean) {
    const trimmed = draft.trim()
    if (save && trimmed && trimmed !== item.content) onRename(trimmed)
    setEditing(false)
  }

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-start gap-2 text-sm ${isDragging ? 'opacity-40' : ''}`}>
      {canEdit && (
        <button type="button" ref={setActivatorNodeRef} aria-label={t.detail.dragChecklist} className="cursor-grab touch-none px-0.5 text-slate-400 hover:text-slate-700" {...attributes} {...listeners}>⠿</button>
      )}
      <input type="checkbox" className="mt-1" checked={item.done} disabled={!canEdit} onChange={(e) => onToggle(e.target.checked)} aria-label={item.content} />
      {editing ? (
        <input
          autoFocus
          className={`${inputClass} flex-1 py-0.5`}
          value={draft}
          maxLength={500}
          aria-label={t.detail.editItem}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finish(true)
            if (e.key === 'Escape') finish(false)
          }}
        />
      ) : canEdit ? (
        <button type="button" className={`flex-1 break-words text-left ${item.done ? 'text-slate-400 line-through' : ''}`} onClick={() => { setDraft(item.content); setEditing(true) }}>
          {item.content}
        </button>
      ) : (
        <span className={`flex-1 break-words ${item.done ? 'text-slate-400 line-through' : ''}`}>{item.content}</span>
      )}
      {canEdit && !editing && (
        <button type="button" aria-label={`${t.common.delete}: ${item.content}`} className="px-1 text-slate-400 hover:text-red-600" onClick={onDelete}>✕</button>
      )}
    </li>
  )
}

export function ChecklistSection({ items, canEdit, onAdd, onToggle, onRename, onMove, onDelete }: Props) {
  const [text, setText] = useState('')
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return
    const position = reorderedPosition(items, String(active.id), String(over.id))
    if (position) onMove(String(active.id), position)
  }

  return (
    <Section title={items.length ? `${t.detail.checklist} (${done}/${items.length})` : t.detail.checklist}>
      {items.length > 0 && (
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {items.map((i) => (
              <Row key={i.id} item={i} canEdit={canEdit} onToggle={(d) => onToggle(i.id, d)} onRename={(c) => onRename(i.id, c)} onDelete={() => onDelete(i.id)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {canEdit && (
        <form onSubmit={submit} className="flex gap-2">
          <input className={inputClass} value={text} maxLength={500} placeholder={t.detail.checklistPlaceholder} aria-label={t.detail.checklistPlaceholder} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={btnPrimaryClass}>{t.common.create}</button>
        </form>
      )}
    </Section>
  )
}
