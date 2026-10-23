import { describe, expect, it } from 'vitest'
import { splitBoards, type BoardWithRole } from './boardsSelectors'

const board = (id: string, updated_at: string, archived_at: string | null = null): BoardWithRole => ({
  id, title: id, owner_id: 'u', archived_at, created_at: updated_at, updated_at, role: 'owner',
})

describe('splitBoards', () => {
  it('separates archived boards and sorts each group by most recently updated', () => {
    const { active, archived } = splitBoards([
      board('old', '2026-01-01'),
      board('new', '2026-03-01'),
      board('arch', '2026-02-01', '2026-02-02'),
    ])
    expect(active.map((b) => b.id)).toEqual(['new', 'old'])
    expect(archived.map((b) => b.id)).toEqual(['arch'])
  })
})
