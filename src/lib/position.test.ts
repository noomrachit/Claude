import { describe, expect, it } from 'vitest'
import { byPosition, positionAtIndex, positionBetween } from './position'

describe('position', () => {
  it('generates ordered keys at both edges and in the middle', () => {
    const a = positionBetween(null, null)
    const b = positionBetween(a, null)
    const mid = positionBetween(a, b)
    const first = positionBetween(null, a)
    expect([b, mid, first, a].sort()).toEqual([first, a, mid, b])
  })

  it('positionAtIndex places an item between neighbours', () => {
    const a = { position: positionBetween(null, null) }
    const b = { position: positionBetween(a.position, null) }
    const p = positionAtIndex([a, b], 1)
    expect(a.position < p && p < b.position).toBe(true)
  })

  it('byPosition sorts lexicographically', () => {
    const items = [{ position: 'a1' }, { position: 'Zz' }, { position: 'a0' }]
    expect(items.sort(byPosition).map((i) => i.position)).toEqual(['Zz', 'a0', 'a1'])
  })
})
