import { describe, expect, it } from 'vitest'
import type { BoardContent } from '@/features/boards/boardContent'
import { buildCardMeta } from './cardMeta'

const content = {
  lists: [], cards: [],
  labels: [{ id: 'L1', board_id: 'b', name: 'urgent', color: '#ef4444', created_at: '' }],
  cardLabels: [{ card_id: 'c1', label_id: 'L1', board_id: 'b' }, { card_id: 'c1', label_id: 'gone', board_id: 'b' }],
  cardAssignees: [{ card_id: 'c1', user_id: 'u1', board_id: 'b' }, { card_id: 'c2', user_id: 'u9', board_id: 'b' }],
  checklistItems: [
    { id: 'i1', card_id: 'c1', board_id: 'b', content: 'a', done: true, position: 'a0', created_at: '', updated_at: '' },
    { id: 'i2', card_id: 'c1', board_id: 'b', content: 'b', done: false, position: 'a1', created_at: '', updated_at: '' },
  ],
} satisfies BoardContent

describe('buildCardMeta', () => {
  const meta = buildCardMeta(content, new Map([['u1', 'Alice']]))
  it('collects labels (ignoring dangling ones), assignees and checklist progress', () => {
    expect(meta.get('c1')).toMatchObject({
      labels: [{ id: 'L1' }],
      assignees: [{ id: 'u1', name: 'Alice' }],
      checklistDone: 1,
      checklistTotal: 2,
    })
  })
  it('falls back to "?" for unknown members and omits cards without data', () => {
    expect(meta.get('c2')!.assignees).toEqual([{ id: 'u9', name: '?' }])
    expect(meta.get('c3')).toBeUndefined()
  })
})
