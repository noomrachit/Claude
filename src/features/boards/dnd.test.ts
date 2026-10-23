import { describe, expect, it } from 'vitest'
import type { Card, List } from '@/types'
import { buildColumns, findContainer, moveCardAcrossColumns, resolveCardDrop, resolveListDrop } from './dnd'

const list = (id: string, position: string): List => ({
  id, board_id: 'b', title: id, position, created_at: '', updated_at: '',
})
const card = (id: string, list_id: string, position: string): Card => ({
  id, board_id: 'b', list_id, title: id, description: '', due_date: null, position,
  archived_at: null, created_by: null, created_at: '', updated_at: '',
})

const lists = [list('L1', 'a0'), list('L2', 'a1'), list('L3', 'a2')]
const cards = [card('c1', 'L1', 'a0'), card('c2', 'L1', 'a1'), card('c3', 'L1', 'a2'), card('d1', 'L2', 'a0')]
const ids = (cs: Card[]) => cs.map((c) => c.id)

describe('buildColumns / findContainer', () => {
  it('groups by list, sorts by position and includes empty lists', () => {
    const cols = buildColumns(lists, [...cards].reverse())
    expect(ids(cols.L1)).toEqual(['c1', 'c2', 'c3'])
    expect(cols.L3).toEqual([])
    expect(findContainer(cols, 'd1')).toBe('L2')
    expect(findContainer(cols, 'L3')).toBe('L3')
    expect(findContainer(cols, 'nope')).toBeUndefined()
  })
})

describe('moveCardAcrossColumns', () => {
  const cols = buildColumns(lists, cards)
  it('inserts before or after the card under the pointer', () => {
    expect(ids(moveCardAcrossColumns(cols, 'c2', 'd1', false).L2)).toEqual(['c2', 'd1'])
    expect(ids(moveCardAcrossColumns(cols, 'c2', 'd1', true).L2)).toEqual(['d1', 'c2'])
  })
  it('appends when hovering an empty list and updates list_id', () => {
    const next = moveCardAcrossColumns(cols, 'c1', 'L3', false)
    expect(ids(next.L3)).toEqual(['c1'])
    expect(next.L3[0].list_id).toBe('L3')
    expect(ids(next.L1)).toEqual(['c2', 'c3'])
  })
  it('does nothing inside the same list', () => {
    expect(moveCardAcrossColumns(cols, 'c1', 'c3', true)).toBe(cols)
  })
})

describe('resolveCardDrop', () => {
  const cols = buildColumns(lists, cards)
  it('reorders inside a list with a key between the neighbours', () => {
    const r = resolveCardDrop(cols, { listId: 'L1', index: 0 }, 'c1', 'c2')!
    expect(r.listId).toBe('L1')
    expect(r.position > 'a1' && r.position < 'a2').toBe(true) // lands between c2 and c3
  })
  it('moves to the top of the list', () => {
    const r = resolveCardDrop(cols, { listId: 'L1', index: 2 }, 'c3', 'c1')!
    expect(r.position < 'a0').toBe(true)
  })
  it('returns null when dropped back in place', () => {
    expect(resolveCardDrop(cols, { listId: 'L1', index: 1 }, 'c2', 'c2')).toBeNull()
  })
  it('computes position after a cross-list move', () => {
    const preview = moveCardAcrossColumns(cols, 'c2', 'd1', true) // L2: d1, c2
    const r = resolveCardDrop(preview, { listId: 'L1', index: 1 }, 'c2', 'c2')!
    expect(r.listId).toBe('L2')
    expect(r.position > 'a0').toBe(true)
  })
  it('drops onto an empty list', () => {
    const preview = moveCardAcrossColumns(cols, 'c1', 'L3', false)
    const r = resolveCardDrop(preview, { listId: 'L1', index: 0 }, 'c1', 'L3')!
    expect(r.listId).toBe('L3')
  })
})

describe('resolveListDrop', () => {
  it('returns a key at the new place or null when unchanged', () => {
    expect(resolveListDrop(lists, 'L1', 'L3')! > 'a2').toBe(true)
    const toFront = resolveListDrop(lists, 'L3', 'L1')!
    expect(toFront < 'a0').toBe(true)
    expect(resolveListDrop(lists, 'L2', 'L2')).toBeNull()
  })
})
