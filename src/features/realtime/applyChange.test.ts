import { describe, expect, it } from 'vitest'
import type { BoardContent } from '@/features/boards/boardContent'
import { applyChange } from './applyChange'

const base = (): BoardContent => ({
  lists: [{ id: 'L1', board_id: 'b', title: 'Todo', position: 'a0', created_at: '', updated_at: '' }],
  cards: [
    { id: 'c1', board_id: 'b', list_id: 'L1', title: 'one', description: '', due_date: null, position: 'a0', archived_at: null, created_by: null, created_at: '', updated_at: '' },
    { id: 'c2', board_id: 'b', list_id: 'L1', title: 'two', description: '', due_date: null, position: 'a1', archived_at: null, created_by: null, created_at: '', updated_at: '' },
  ],
  labels: [{ id: 'lb', board_id: 'b', name: 'x', color: '#ef4444', created_at: '' }],
  cardLabels: [{ card_id: 'c1', label_id: 'lb', board_id: 'b' }],
  cardAssignees: [{ card_id: 'c1', user_id: 'u1', board_id: 'b' }],
  checklistItems: [{ id: 'i1', card_id: 'c1', board_id: 'b', content: 'a', done: false, position: 'a0', created_at: '', updated_at: '' }],
})

const card = (over: object) => ({ ...base().cards[0], ...over })

describe('applyChange', () => {
  it('inserts a card and keeps position order', () => {
    const next = applyChange(base(), 'cards', 'INSERT', card({ id: 'c3', position: 'a0V' }), {})
    expect(next.cards.map((c) => c.id)).toEqual(['c1', 'c3', 'c2'])
  })
  it('is idempotent for echoes of our own writes', () => {
    const once = applyChange(base(), 'cards', 'UPDATE', card({ title: 'new' }), {})
    const twice = applyChange(once, 'cards', 'UPDATE', card({ title: 'new' }), {})
    expect(twice.cards).toEqual(once.cards)
    expect(twice.cards).toHaveLength(2)
  })
  it('moves a card to another list/position on UPDATE', () => {
    const next = applyChange(base(), 'cards', 'UPDATE', card({ list_id: 'L2', position: 'Zz' }), {})
    expect(next.cards[0]).toMatchObject({ id: 'c1', list_id: 'L2', position: 'Zz' })
    expect(next.cards.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
  it('drops archived cards and their children', () => {
    const next = applyChange(base(), 'cards', 'UPDATE', card({ archived_at: '2026-01-01' }), {})
    expect(next.cards.map((c) => c.id)).toEqual(['c2'])
    expect(next.cardLabels).toEqual([])
    expect(next.checklistItems).toEqual([])
  })
  it('deletes a card with its labels, assignees and checklist', () => {
    const next = applyChange(base(), 'cards', 'DELETE', {}, { id: 'c1' })
    expect(next.cards.map((c) => c.id)).toEqual(['c2'])
    expect(next.cardAssignees).toEqual([])
  })
  it('deleting a list removes its cards', () => {
    const next = applyChange(base(), 'lists', 'DELETE', {}, { id: 'L1' })
    expect(next.lists).toEqual([])
    expect(next.cards).toEqual([])
  })
  it('handles composite-key join tables', () => {
    const added = applyChange(base(), 'card_assignees', 'INSERT', { card_id: 'c2', user_id: 'u2', board_id: 'b' }, {})
    expect(added.cardAssignees).toHaveLength(2)
    const removed = applyChange(added, 'card_assignees', 'DELETE', {}, { card_id: 'c1', user_id: 'u1', board_id: 'b' })
    expect(removed.cardAssignees).toEqual([{ card_id: 'c2', user_id: 'u2', board_id: 'b' }])
    const unlabeled = applyChange(base(), 'card_labels', 'DELETE', {}, { card_id: 'c1', label_id: 'lb', board_id: 'b' })
    expect(unlabeled.cardLabels).toEqual([])
  })
  it('deleting a label detaches it from cards', () => {
    const next = applyChange(base(), 'labels', 'DELETE', {}, { id: 'lb' })
    expect(next.labels).toEqual([])
    expect(next.cardLabels).toEqual([])
  })
  it('updates checklist items', () => {
    const next = applyChange(base(), 'checklist_items', 'UPDATE', { ...base().checklistItems[0], done: true }, {})
    expect(next.checklistItems[0].done).toBe(true)
  })
})
