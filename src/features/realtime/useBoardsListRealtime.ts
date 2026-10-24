import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { useRealtimeChannel } from './useRealtimeChannel'

/** Keeps the board list fresh: membership changes and renames/archiving arrive on `user:<id>`. */
export function useBoardsListRealtime() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Several events can arrive together (e.g. a board with many members); refetch once.
  const refresh = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!userId) return
      void qc.invalidateQueries({ queryKey: queryKeys.boards(userId) })
      void qc.invalidateQueries({ queryKey: ['board', userId] })
    }, 200)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return useRealtimeChannel(userId ? `user:${userId}` : null, refresh, refresh)
}
