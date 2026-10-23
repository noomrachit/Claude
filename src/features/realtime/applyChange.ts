import { withoutCards, type BoardContent } from '@/features/boards/boardContent'
import { byPosition } from '@/lib/position'

export type ContentTable = 'lists' | 'cards' | 'labels' | 'card_labels' | 'card_assignees' | 'checklist_items'
export type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE'
type Row = Record<string, unknown>

export const CONTENT_TABLES: ContentTable[] = ['lists', 'cards', 'labels', 'card_labels', 'card_assignees', 'checklist_items']

/** Inserts or replaces the row that `same` matches; DELETE removes it. */
function upsert<T>(rows: T[], type: ChangeType, record: T, old: Partial<T>, same: (a: Partial<T>, b: Partial<T>) => boolean): T[] {
  if (type === 'DELETE') return rows.filter((r) => !same(r, old))
  const i = rows.findIndex((r) => same(r, record))
  return i === -1 ? [...rows, record] : rows.map((r, j) => (j === i ? record : r))
}

const byId = (a: { id?: string }, b: { id?: string }) => a.id === b.id
const byCardAnd = (key: 'label_id' | 'user_id') => (a: Row, b: Row) => a.card_id === b.card_id && a[key] === b[key]

/**
 * Pure reducer: applies one Realtime row change to the cached board content.
 * Changes are idempotent, so the echo of our own write is harmless.
 */
export function applyChange(c: BoardContent, table: ContentTable, type: ChangeType, record: Row, old: Row): BoardContent {
  const rec = record as never
  const prev = old as never
  switch (table) {
    case 'lists': {
      if (type === 'DELETE') {
        const ids = new Set(c.cards.filter((x) => x.list_id === old.id).map((x) => x.id))
        return { ...withoutCards(c, ids), lists: c.lists.filter((l) => l.id !== old.id) }
      }
      return { ...c, lists: upsert(c.lists, type, rec, prev, byId).sort(byPosition) }
    }
    case 'cards': {
      if (type === 'DELETE') return withoutCards(c, new Set([String(old.id)]))
      // Archived cards leave the board view.
      if (record.archived_at) return withoutCards(c, new Set([String(record.id)]))
      return { ...c, cards: upsert(c.cards, type, rec, prev, byId).sort(byPosition) }
    }
    case 'labels': {
      if (type === 'DELETE') {
        return { ...c, labels: c.labels.filter((l) => l.id !== old.id), cardLabels: c.cardLabels.filter((x) => x.label_id !== old.id) }
      }
      return { ...c, labels: upsert(c.labels, type, rec, prev, byId) }
    }
    case 'card_labels':
      return { ...c, cardLabels: upsert(c.cardLabels, type, rec, prev, byCardAnd('label_id') as never) }
    case 'card_assignees':
      return { ...c, cardAssignees: upsert(c.cardAssignees, type, rec, prev, byCardAnd('user_id') as never) }
    case 'checklist_items':
      return { ...c, checklistItems: upsert(c.checklistItems, type, rec, prev, byId).sort(byPosition) }
  }
}
