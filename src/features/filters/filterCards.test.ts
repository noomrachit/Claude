import { describe, expect, it } from 'vitest'
import type { CardMeta } from '@/features/cards/cardMeta'
import type { Card } from '@/types'
import { matchingCardIds, NO_ASSIGNEE, NO_FILTERS, parseFilters, writeFilters } from './filterCards'

const card = (id: string, title: string, description = ''): Card => ({
  id, board_id: 'b', list_id: 'l', title, description, due_date: null, position: id,
  archived_at: null, created_by: null, created_at: '', updated_at: '',
})
const label = (id: string) => ({ id, board_id: 'b', name: id, color: '#fff', created_at: '' })
const meta = (labels: string[], assignees: string[]): CardMeta => ({
  labels: labels.map(label), checklistDone: 0, checklistTotal: 0, assignees: assignees.map((id) => ({ id, name: id })),
})

const cards = [card('1', 'Fix Login bug', 'password reset'), card('2', 'Design home'), card('3', 'Write docs')]
const m = new Map<string, CardMeta>([
  ['1', meta(['red'], ['alice'])],
  ['2', meta(['red', 'blue'], ['bob'])],
])
const run = (f: Partial<typeof NO_FILTERS>) => [...(matchingCardIds(cards, m, { ...NO_FILTERS, ...f }) ?? [])].sort()

describe('matchingCardIds', () => {
  it('returns null when nothing is filtered', () => {
    expect(matchingCardIds(cards, m, NO_FILTERS)).toBeNull()
    expect(matchingCardIds(cards, m, { ...NO_FILTERS, q: '   ' })).toBeNull()
  })
  it('searches title and description case-insensitively', () => {
    expect(run({ q: 'LOGIN' })).toEqual(['1'])
    expect(run({ q: 'password' })).toEqual(['1'])
    expect(run({ q: 'zzz' })).toEqual([])
  })
  it('matches any selected label', () => {
    expect(run({ labelIds: ['blue'] })).toEqual(['2'])
    expect(run({ labelIds: ['blue', 'red'] })).toEqual(['1', '2'])
  })
  it('matches any selected assignee, and "no assignee"', () => {
    expect(run({ assigneeIds: ['alice'] })).toEqual(['1'])
    expect(run({ assigneeIds: [NO_ASSIGNEE] })).toEqual(['3'])
    expect(run({ assigneeIds: ['bob', NO_ASSIGNEE] })).toEqual(['2', '3'])
  })
  it('combines different filter groups with AND', () => {
    expect(run({ q: 'design', labelIds: ['red'], assigneeIds: ['bob'] })).toEqual(['2'])
    expect(run({ q: 'design', labelIds: ['red'], assigneeIds: ['alice'] })).toEqual([])
  })
})

describe('URL params', () => {
  it('round-trips filters and preserves unrelated params', () => {
    const params = new URLSearchParams('card=c1')
    writeFilters(params, { q: ' hi ', labelIds: ['a', 'b'], assigneeIds: ['u'] })
    expect(params.get('card')).toBe('c1')
    expect(parseFilters(params)).toEqual({ q: 'hi', labelIds: ['a', 'b'], assigneeIds: ['u'] })
  })
  it('removes empty filters from the URL', () => {
    const params = new URLSearchParams('q=x&label=a&who=b&card=c1')
    writeFilters(params, NO_FILTERS)
    expect(params.toString()).toBe('card=c1')
  })
})
