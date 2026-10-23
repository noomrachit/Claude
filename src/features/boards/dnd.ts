import { arrayMove } from '@dnd-kit/sortable'
import { byPosition, positionAtIndex } from '@/lib/position'
import type { Card, List } from '@/types'

/** Cards grouped by list id, each group sorted by position. */
export type Columns = Record<string, Card[]>

export function buildColumns(lists: List[], cards: Card[]): Columns {
  const columns: Columns = Object.fromEntries(lists.map((l) => [l.id, [] as Card[]]))
  for (const card of [...cards].sort(byPosition)) columns[card.list_id]?.push(card)
  return columns
}

/** `id` may be a list id or a card id. */
export function findContainer(columns: Columns, id: string): string | undefined {
  if (id in columns) return id
  return Object.keys(columns).find((listId) => columns[listId].some((c) => c.id === id))
}

/**
 * Live preview while dragging over another list: moves the active card into the
 * list under the pointer. Same-list reordering is left to dnd-kit's sortable transforms.
 */
export function moveCardAcrossColumns(columns: Columns, activeId: string, overId: string, isBelowOver: boolean): Columns {
  const from = findContainer(columns, activeId)
  const to = findContainer(columns, overId)
  if (!from || !to || from === to) return columns

  const active = columns[from].find((c) => c.id === activeId)!
  const target = columns[to]
  const overIndex = target.findIndex((c) => c.id === overId)
  const insertAt = overIndex === -1 ? target.length : overIndex + (isBelowOver ? 1 : 0)

  return {
    ...columns,
    [from]: columns[from].filter((c) => c.id !== activeId),
    [to]: [...target.slice(0, insertAt), { ...active, list_id: to }, ...target.slice(insertAt)],
  }
}

/**
 * Where the dragged card ends up: target list and new position key, or null when it
 * is dropped back where it started (`original.index` is its index in its list at drag start).
 */
export function resolveCardDrop(
  columns: Columns,
  original: { listId: string; index: number },
  activeId: string,
  overId: string,
): { listId: string; position: string } | null {
  const listId = findContainer(columns, activeId)
  if (!listId) return null
  const column = columns[listId]
  const oldIndex = column.findIndex((c) => c.id === activeId)
  const overIndex = column.findIndex((c) => c.id === overId)
  const newIndex = overId in columns ? column.length - 1 : overIndex === -1 ? oldIndex : overIndex

  const ordered = arrayMove(column, oldIndex, newIndex)
  const index = ordered.findIndex((c) => c.id === activeId)
  if (listId === original.listId && index === original.index) return null

  const rest = ordered.filter((c) => c.id !== activeId)
  return { listId, position: positionAtIndex(rest, index) }
}

/** Reorders lists: returns the new position key for `activeId` dropped on `overId`, or null if unchanged. */
export function resolveListDrop(lists: List[], activeId: string, overId: string): string | null {
  const oldIndex = lists.findIndex((l) => l.id === activeId)
  const newIndex = lists.findIndex((l) => l.id === overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null
  const ordered = arrayMove(lists, oldIndex, newIndex)
  const rest = ordered.filter((l) => l.id !== activeId)
  return positionAtIndex(rest, newIndex)
}
