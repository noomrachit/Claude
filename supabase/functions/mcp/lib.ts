// Pure helpers for the MCP function (no Deno or npm imports, so they can be unit-tested with Vitest).

export interface ListRow { id: string; title: string; position: string }
export interface CardRow {
  id: string
  list_id: string
  title: string
  description: string
  due_date: string | null
  position: string
}
export interface LabelRow { id: string; name: string; color: string }
export interface CardLabelRow { card_id: string; label_id: string }

/** Extracts the token from an `Authorization: Bearer <token>` header. */
export function bearerToken(header: string | null | undefined): string | null {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header ?? '')
  return m ? m[1] : null
}

/** Picks the API key from the default Edge Function secrets (new publishable keys first, legacy anon key second). */
export function publishableKey(env: { get(name: string): string | undefined }): string | null {
  const keys = env.get('SUPABASE_PUBLISHABLE_KEYS')
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, string>
      if (parsed.default) return parsed.default
    } catch {
      // fall through to the legacy key
    }
  }
  return env.get('SUPABASE_ANON_KEY') ?? null
}

const byPosition = <T extends { position: string }>(a: T, b: T) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0)

/** Board as nested lists → cards, the shape returned to the model. */
export function shapeBoard(lists: ListRow[], cards: CardRow[], labels: LabelRow[], cardLabels: CardLabelRow[]) {
  const labelById = new Map(labels.map((l) => [l.id, l]))
  const labelsOf = new Map<string, string[]>()
  for (const cl of cardLabels) {
    const label = labelById.get(cl.label_id)
    if (!label) continue
    labelsOf.set(cl.card_id, [...(labelsOf.get(cl.card_id) ?? []), label.name || label.color])
  }
  return [...lists].sort(byPosition).map((list) => ({
    id: list.id,
    title: list.title,
    cards: cards
      .filter((c) => c.list_id === list.id)
      .sort(byPosition)
      .map((c) => ({
        id: c.id,
        title: c.title,
        ...(c.description ? { description: c.description } : {}),
        ...(c.due_date ? { due_date: c.due_date } : {}),
        ...(labelsOf.get(c.id) ? { labels: labelsOf.get(c.id) } : {}),
      })),
  }))
}

/**
 * Neighbour keys for placing a card at the top or bottom of a list (excluding the card itself).
 * Feed the result to fractional-indexing's generateKeyBetween(before, after).
 */
export function neighboursFor(where: 'top' | 'bottom', siblings: { id: string; position: string }[], excludeId?: string) {
  const sorted = siblings.filter((s) => s.id !== excludeId).sort(byPosition)
  return where === 'top'
    ? { before: null, after: sorted[0]?.position ?? null }
    : { before: sorted.at(-1)?.position ?? null, after: null }
}

/**
 * `%text%` pattern for a PostgREST `or=(col.ilike.<pattern>,...)` filter.
 * Characters that are syntax inside `or=(...)` (comma, parentheses, quotes, backslash) and the
 * PostgREST wildcard `*` are replaced by spaces; LIKE wildcards `%` and `_` are escaped so they match literally.
 */
export function likePattern(text: string): string {
  const safe = text.replace(/[,()"\\*]/g, ' ').replace(/[%_]/g, (ch) => `\\${ch}`)
  return `%${safe}%`
}

/** MCP tool result helpers. */
export const ok = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] })
export const fail = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true })
