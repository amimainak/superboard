// ============================================================
// useRecordingIndicator — broadcast + receive recording state
// ============================================================
// Broadcasts the student's recording state (isRecording: true/false)
// on the room's Supabase Realtime channel. The tutor subscribes to
// the same channel to see the "Student is recording" indicator,
// even if they're in a different tab.
// ============================================================

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Hook for the STUDENT side — broadcasts their recording state.
 * Call setRecordingState(true/false) when recording starts/stops.
 */
export function useRecordingBroadcaster(roomId: string) {
  const channelRef = useRef<ReturnType<typeof getSupabaseBrowserClient> extends infer T ? any : null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const channel = supabase.channel(`recording:${roomId}`)
    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId])

  const setRecordingState = useCallback((isRecording: boolean) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'recording-state',
      payload: { isRecording, timestamp: Date.now() },
    })
  }, [])

  return { setRecordingState }
}

/**
 * Hook for the TUTOR side — listens for recording state broadcasts.
 * Returns whether a student is currently recording.
 */
export function useRecordingListener(roomId: string) {
  const [studentRecording, setStudentRecording] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const channel = supabase.channel(`recording:${roomId}`)
    channel.on('broadcast', { event: 'recording-state' }, (payload: { payload: { isRecording: boolean; timestamp: number } }) => {
      setStudentRecording(payload.payload.isRecording)
    })
    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return studentRecording
}

