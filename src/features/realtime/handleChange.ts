import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import type { BoardContent } from '@/features/boards/boardContent'
import { applyChange, CONTENT_TABLES, type ChangeType, type ContentTable } from './applyChange'

export interface Change {
  table: string
  eventType: ChangeType
  new: Record<string, unknown>
  old: Record<string, unknown>
}

/** Shape of the payload sent by realtime.broadcast_changes() from our database triggers. */
export interface BroadcastPayload {
  table: string
  operation: ChangeType
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
}

export function toChange(p: BroadcastPayload): Change {
  return { table: p.table, eventType: p.operation, new: p.record ?? {}, old: p.old_record ?? {} }
}

const isContentTable = (t: string): t is ContentTable => (CONTENT_TABLES as string[]).includes(t)

/** True while one of our own mutations is in flight. */
const hasPendingMutations = (qc: QueryClient) => qc.isMutating() > 0

/**
 * While we have writes in flight, applying remote events could overwrite our optimistic
 * state with older data. We drop those events and refetch once we are idle instead.
 */
export function scheduleResync(qc: QueryClient, boardId: string, userId: string, attempt = 0) {
  setTimeout(() => {
    if (hasPendingMutations(qc) && attempt < 20) return scheduleResync(qc, boardId, userId, attempt + 1)
    void qc.invalidateQueries({ queryKey: queryKeys.content(boardId) })
    void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) })
    void qc.invalidateQueries({ queryKey: queryKeys.board(userId, boardId) })
  }, 300)
}

let resyncTimer: ReturnType<typeof setTimeout> | undefined
const debouncedResync = (qc: QueryClient, boardId: string, userId: string) => {
  clearTimeout(resyncTimer)
  resyncTimer = setTimeout(() => scheduleResync(qc, boardId, userId), 200)
}

export function handleChange(qc: QueryClient, boardId: string, userId: string, change: Change, isBusy = hasPendingMutations) {
  const { table, eventType, new: record, old } = change

  if (isBusy(qc)) return debouncedResync(qc, boardId, userId)

  if (isContentTable(table)) {
    qc.setQueryData<BoardContent>(queryKeys.content(boardId), (c) => (c ? applyChange(c, table, eventType, record, old) : c))
    return
  }

  switch (table) {
    case 'attachments':
    case 'comments': {
      const cardId = String(record.card_id ?? old.card_id ?? '')
      if (cardId) void qc.invalidateQueries({ queryKey: [table, cardId] })
      return
    }
    case 'board_members': {
      void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) })
      void qc.invalidateQueries({ queryKey: queryKeys.invitations(boardId) })
      const affected = String(record.user_id ?? old.user_id ?? '')
      if (affected === userId) {
        // Our own role changed or we were removed from the board.
        void qc.invalidateQueries({ queryKey: queryKeys.board(userId, boardId) })
        void qc.invalidateQueries({ queryKey: queryKeys.boards(userId) })
      }
      return
    }
    case 'boards':
      void qc.invalidateQueries({ queryKey: queryKeys.board(userId, boardId) })
      void qc.invalidateQueries({ queryKey: queryKeys.boards(userId) })
      return
  }
}
