import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { queryKeys } from '@/lib/queryKeys'
import type { BoardContent } from '@/features/boards/boardContent'
import { handleChange, toChange } from './handleChange'

const empty: BoardContent = { lists: [], cards: [], labels: [], cardLabels: [], cardAssignees: [], checklistItems: [] }
const setup = () => {
  const qc = new QueryClient()
  qc.setQueryData(queryKeys.content('b'), empty)
  return qc
}
const listInsert = { table: 'lists', eventType: 'INSERT' as const, new: { id: 'L', board_id: 'b', title: 't', position: 'a0' }, old: {} }

describe('handleChange', () => {
  it('applies content changes to the cache', () => {
    const qc = setup()
    handleChange(qc, 'b', 'me', listInsert, () => false)
    expect(qc.getQueryData<BoardContent>(queryKeys.content('b'))!.lists).toHaveLength(1)
  })
  it('ignores events while own mutations are in flight (refetch happens later)', () => {
    const qc = setup()
    handleChange(qc, 'b', 'me', listInsert, () => true)
    expect(qc.getQueryData<BoardContent>(queryKeys.content('b'))!.lists).toHaveLength(0)
  })
  it('invalidates per-card queries for comments and attachments', () => {
    const qc = setup()
    qc.setQueryData(['comments', 'c1'], [])
    handleChange(qc, 'b', 'me', { table: 'comments', eventType: 'INSERT', new: { card_id: 'c1' }, old: {} }, () => false)
    expect(qc.getQueryState(['comments', 'c1'])!.isInvalidated).toBe(true)
  })
  it('refreshes board access when our own membership changes, but not for others', () => {
    const qc = setup()
    qc.setQueryData(queryKeys.board('me', 'b'), {})
    handleChange(qc, 'b', 'me', { table: 'board_members', eventType: 'UPDATE', new: { user_id: 'other' }, old: {} }, () => false)
    expect(qc.getQueryState(queryKeys.board('me', 'b'))!.isInvalidated).toBe(false)
    handleChange(qc, 'b', 'me', { table: 'board_members', eventType: 'DELETE', new: {}, old: { user_id: 'me' } }, () => false)
    expect(qc.getQueryState(queryKeys.board('me', 'b'))!.isInvalidated).toBe(true)
  })
})

describe('toChange', () => {
  it('maps a broadcast payload and defaults missing rows to empty objects', () => {
    expect(toChange({ table: 'cards', operation: 'DELETE', record: null, old_record: { id: 'c1', board_id: 'b' } })).toEqual({
      table: 'cards', eventType: 'DELETE', new: {}, old: { id: 'c1', board_id: 'b' },
    })
    expect(toChange({ table: 'lists', operation: 'INSERT', record: { id: 'l' }, old_record: null }).old).toEqual({})
  })
})
