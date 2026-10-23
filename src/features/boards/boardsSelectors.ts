import type { Board, BoardRole } from '@/types'

export type BoardWithRole = Board & { role: BoardRole }

const byRecent = (a: Board, b: Board) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0)

export function splitBoards(boards: BoardWithRole[]) {
  return {
    active: boards.filter((b) => !b.archived_at).sort(byRecent),
    archived: boards.filter((b) => b.archived_at).sort(byRecent),
  }
}
