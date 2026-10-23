import type { BoardContent } from '@/features/boards/boardContent'
import type { Label } from '@/types'

export interface CardMeta {
  labels: Label[]
  checklistDone: number
  checklistTotal: number
  assignees: { id: string; name: string }[]
}

export const EMPTY_META: CardMeta = { labels: [], checklistDone: 0, checklistTotal: 0, assignees: [] }

/** Per-card badge data for tiles, derived from the board cache. `names` maps user id -> display name. */
export function buildCardMeta(c: BoardContent, names: Map<string, string>): Map<string, CardMeta> {
  const meta = new Map<string, CardMeta>()
  const get = (cardId: string) => {
    let m = meta.get(cardId)
    if (!m) meta.set(cardId, (m = { labels: [], checklistDone: 0, checklistTotal: 0, assignees: [] }))
    return m
  }
  const labelById = new Map(c.labels.map((l) => [l.id, l]))
  for (const cl of c.cardLabels) {
    const label = labelById.get(cl.label_id)
    if (label) get(cl.card_id).labels.push(label)
  }
  for (const a of c.cardAssignees) get(a.card_id).assignees.push({ id: a.user_id, name: names.get(a.user_id) ?? '?' })
  for (const item of c.checklistItems) {
    const m = get(item.card_id)
    m.checklistTotal++
    if (item.done) m.checklistDone++
  }
  return meta
}
