import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { handleChange, toChange, type BroadcastPayload } from './handleChange'
import { useRealtimeChannel, type RealtimeStatus } from './useRealtimeChannel'

export type { RealtimeStatus }

/** Live updates for the open board: one private channel `board:<id>` for every table of the board. */
export function useBoardRealtime(boardId: string): RealtimeStatus {
  const qc = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id

  return useRealtimeChannel(
    userId ? `board:${boardId}` : null,
    (payload: BroadcastPayload) => userId && handleChange(qc, boardId, userId, toChange(payload)),
    () => void qc.invalidateQueries({ queryKey: queryKeys.content(boardId) }),
  )
}
