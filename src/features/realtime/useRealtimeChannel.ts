import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import type { BroadcastPayload } from './handleChange'

export type RealtimeStatus = 'connecting' | 'live' | 'offline'

const EVENTS = ['INSERT', 'UPDATE', 'DELETE'] as const

/**
 * Subscribes to a private Broadcast channel fed by the database triggers (see migration
 * `realtime_broadcast`). `onReconnect` fires when the connection comes back after a drop,
 * because events may have been missed in between.
 */
export function useRealtimeChannel(
  topic: string | null,
  onEvent: (payload: BroadcastPayload) => void,
  onReconnect: () => void,
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  // Always call the latest callbacks without resubscribing on every render.
  const handlers = useRef({ onEvent, onReconnect })
  useEffect(() => {
    handlers.current = { onEvent, onReconnect }
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !topic) return
    let cancelled = false
    let hasConnected = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Private channels authorise with the user's JWT, so make sure the socket has it before joining.
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return
      let ch = supabase.channel(topic, { config: { private: true } })
      for (const event of EVENTS) {
        ch = ch.on('broadcast', { event }, (msg: { payload: BroadcastPayload }) => handlers.current.onEvent(msg.payload))
      }
      ch.subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          setStatus('live')
          if (hasConnected) handlers.current.onReconnect()
          hasConnected = true
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          setStatus('offline')
        }
      })
      channel = ch
    })

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [topic])

  return status
}
