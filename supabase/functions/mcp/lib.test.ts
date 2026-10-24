import { describe, expect, it } from 'vitest'
import { bearerToken, fail, likePattern, neighboursFor, ok, publishableKey, shapeBoard } from './lib'

describe('bearerToken', () => {
  it('extracts the token and rejects anything else', () => {
    expect(bearerToken('Bearer abc.def')).toBe('abc.def')
    expect(bearerToken('bearer   xyz ')).toBe('xyz')
    expect(bearerToken('Basic abc')).toBeNull()
    expect(bearerToken('Bearer a b')).toBeNull()
    expect(bearerToken(undefined)).toBeNull()
  })
})

describe('publishableKey', () => {
  const env = (vars: Record<string, string>) => ({ get: (k: string) => vars[k] })
  it('prefers the new publishable key, falls back to the legacy anon key', () => {
    expect(publishableKey(env({ SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}', SUPABASE_ANON_KEY: 'legacy' }))).toBe('sb_publishable_x')
    expect(publishableKey(env({ SUPABASE_PUBLISHABLE_KEYS: 'not json', SUPABASE_ANON_KEY: 'legacy' }))).toBe('legacy')
    expect(publishableKey(env({}))).toBeNull()
  })
})

describe('shapeBoard', () => {
  it('nests cards under lists in position order with label names', () => {
    const board = shapeBoard(
      [{ id: 'l2', title: 'Done', position: 'a1' }, { id: 'l1', title: 'Todo', position: 'a0' }],
      [
        { id: 'c2', list_id: 'l1', title: 'second', description: '', due_date: null, position: 'a1' },
        { id: 'c1', list_id: 'l1', title: 'first', description: 'd', due_date: '2026-01-01T00:00:00Z', position: 'a0' },
      ],
      [{ id: 'r', name: '', color: '#ef4444' }, { id: 'g', name: 'urgent', color: '#22c55e' }],
      [{ card_id: 'c1', label_id: 'r' }, { card_id: 'c1', label_id: 'g' }, { card_id: 'c2', label_id: 'missing' }],
    )
    expect(board.map((l) => l.title)).toEqual(['Todo', 'Done'])
    expect(board[0].cards).toEqual([
      { id: 'c1', title: 'first', description: 'd', due_date: '2026-01-01T00:00:00Z', labels: ['#ef4444', 'urgent'] },
      { id: 'c2', title: 'second' },
    ])
    expect(board[1].cards).toEqual([])
  })
})

describe('neighboursFor', () => {
  const sibs = [{ id: 'b', position: 'a1' }, { id: 'a', position: 'a0' }, { id: 'c', position: 'a2' }]
  it('returns the edge keys for top/bottom', () => {
    expect(neighboursFor('top', sibs)).toEqual({ before: null, after: 'a0' })
    expect(neighboursFor('bottom', sibs)).toEqual({ before: 'a2', after: null })
    expect(neighboursFor('bottom', [])).toEqual({ before: null, after: null })
  })
  it('ignores the card being moved', () => {
    expect(neighboursFor('bottom', sibs, 'c')).toEqual({ before: 'a1', after: null })
  })
})

describe('result helpers', () => {
  it('wraps values and errors as MCP tool results', () => {
    expect(ok({ a: 1 }).content[0].text).toContain('"a": 1')
    expect(fail('nope')).toEqual({ content: [{ type: 'text', text: 'nope' }], isError: true })
  })
})

describe('likePattern', () => {
  it('wraps in % and neutralises filter syntax and LIKE wildcards', () => {
    expect(likePattern('login')).toBe('%login%')
    expect(likePattern('50%_off')).toBe('%50\\%\\_off%')
    expect(likePattern('a,b(c)"d*e\\f')).toBe('%a b c  d e f%')
  })
})
