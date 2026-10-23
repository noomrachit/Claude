import type { CardMeta } from '@/features/cards/cardMeta'
import type { Card } from '@/types'

export const NO_ASSIGNEE = 'none'

export interface Filters {
  q: string
  labelIds: string[]
  /** User ids, or NO_ASSIGNEE for cards nobody is assigned to. */
  assigneeIds: string[]
}

export const NO_FILTERS: Filters = { q: '', labelIds: [], assigneeIds: [] }

export const isFiltering = (f: Filters) => f.q.trim() !== '' || f.labelIds.length > 0 || f.assigneeIds.length > 0

/**
 * Ids of the cards that pass every active filter (null = no filter active).
 * Text matches title or description; within labels/assignees any selection matches; groups combine with AND.
 */
export function matchingCardIds(cards: Card[], meta: Map<string, CardMeta>, f: Filters): Set<string> | null {
  if (!isFiltering(f)) return null
  const q = f.q.trim().toLowerCase()
  const labels = new Set(f.labelIds)
  const people = new Set(f.assigneeIds)

  const ids = new Set<string>()
  for (const card of cards) {
    if (q && !card.title.toLowerCase().includes(q) && !card.description.toLowerCase().includes(q)) continue
    const m = meta.get(card.id)
    if (labels.size && !(m?.labels ?? []).some((l) => labels.has(l.id))) continue
    if (people.size) {
      const assigned = m?.assignees ?? []
      const hit = assigned.length === 0 ? people.has(NO_ASSIGNEE) : assigned.some((a) => people.has(a.id))
      if (!hit) continue
    }
    ids.add(card.id)
  }
  return ids
}

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

export function parseFilters(params: URLSearchParams): Filters {
  return { q: params.get('q') ?? '', labelIds: list(params.get('label')), assigneeIds: list(params.get('who')) }
}

/** Writes the filters into `params` (keeping unrelated params such as `card`) and returns it. */
export function writeFilters(params: URLSearchParams, f: Filters): URLSearchParams {
  const set = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key))
  set('q', f.q.trim())
  set('label', f.labelIds.join(','))
  set('who', f.assigneeIds.join(','))
  return params
}
