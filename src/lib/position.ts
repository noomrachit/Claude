import { generateKeyBetween } from 'fractional-indexing'

/** Position for an item dropped between two neighbours (null = list edge). */
export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after)
}

/** Position for the item at `index` once `items` (already sorted, without the moved item) is in place. */
export function positionAtIndex(items: { position: string }[], index: number): string {
  const before = items[index - 1]?.position ?? null
  const after = items[index]?.position ?? null
  return generateKeyBetween(before, after)
}

export function byPosition<T extends { position: string }>(a: T, b: T): number {
  return a.position < b.position ? -1 : a.position > b.position ? 1 : 0
}
