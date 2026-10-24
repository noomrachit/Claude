import { arrayMove } from '@dnd-kit/sortable'
import { generateKeyBetween } from 'fractional-indexing'

/** Position for an item dropped between two neighbours (null = list edge). */
export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after)
}

/** Position for the item at `index` once `items` (already sorted, without the moved item) is in place. */
export function positionAtIndex(items: { position: string }[], index: number): string {
  const before = items[index - 1]?.position ?? null
  const after = items[index]?.position ?? null
  return generateKeyBetween(before, after)
}

export function byPosition<T extends { position: string }>(a: T, b: T): number {
  return a.position < b.position ? -1 : a.position > b.position ? 1 : 0
}

/**
 * New position key for `activeId` after it is dropped on `overId` (arrayMove semantics),
 * or null when nothing changes. `items` must be sorted by position.
 */
export function reorderedPosition<T extends { id: string; position: string }>(items: T[], activeId: string, overId: string): string | null {
  const oldIndex = items.findIndex((i) => i.id === activeId)
  const newIndex = items.findIndex((i) => i.id === overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null
  const rest = arrayMove(items, oldIndex, newIndex).filter((i) => i.id !== activeId)
  return positionAtIndex(rest, newIndex)
}
