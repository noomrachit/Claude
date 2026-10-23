import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { handleChange, type Change } from './handleChange'

export type RealtimeStatus = 'connecting' | 'live' | 'offline'

const BOARD_CHILD_TABLES = [
  'lists', 'cards', 'labels', 'card_labels', 'card_assignees',
  'checklist_items', 'attachments', 'comments', 'board_members',
] as const

/**
 * One Realtime channel per open board. Every child table is filtered by board_id
 * (denormalised on each table), so a client only receives events for its own board.
 */
export function useBoardRealtime(boardId: string): RealtimeStatus {
  const qc = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    let hasConnected = false

    const onChange = (payload: { table: string; eventType: string; new: object; old: object }) =>
      handleChange(qc, boardId, userId, payload as unknown as Change)

    let channel = supabase.channel(`board:${boardId}`)
    for (const table of BOARD_CHILD_TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `board_id=eq.${boardId}` }, onChange)
    }
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` }, onChange)

    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED') {
        setStatus('live')
        // After a reconnect we may have missed events: refetch instead of trusting the cache.
        if (hasConnected) void qc.invalidateQueries({ queryKey: queryKeys.content(boardId) })
        hasConnected = true
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        setStatus('offline')
      }
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [qc, boardId, userId])

  return status
}
