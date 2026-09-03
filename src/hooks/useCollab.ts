// ============================================================
// Superboard — Unified Collaboration Hook
// Tries Yjs/Hocuspocus (CRDT) first, falls back to Supabase
// Realtime Broadcast (last-write-wins) if Hocuspocus is unavailable.
// ============================================================

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Y from 'yjs'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useCollabStore } from '@/lib/collab/store'
import { initRealtimeSync } from '@/lib/collab/realtime-sync'
import type { RemoteUser } from '@/lib/collab/store'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

export type CollabMode = 'yjs' | 'supabase' | 'disconnected'

export interface UseCollabOptions {
  roomId: string
  userId?: string
  userName?: string
  userColor?: string
  userRole?: 'tutor' | 'student'
}

export interface UseCollabReturn {
  mode: CollabMode
  isConnected: boolean
  remoteUserCount: number
}

/**
 * Unified collaboration hook.
 *
 * 1. Creates a Yjs document and attempts to connect to Hocuspocus.
 * 2. If Hocuspocus connects within 3 seconds, uses Yjs for element sync.
 * 3. If Hocuspocus is unavailable, falls back to Supabase Realtime Broadcast.
 * 4. Both modes update the same Zustand store, so the UI is agnostic.
 */
export function useCollab(options: UseCollabOptions): UseCollabReturn {
  const { roomId, userId = 'anonymous', userName = 'User', userColor = '#3b82f6', userRole = 'tutor' } = options

  const [mode, setMode] = useState<CollabMode>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  const [remoteUserCount, setRemoteUserCount] = useState(0)

  const ydocRef = useRef<Y.Doc | null>(null)
  const yElementsRef = useRef<Y.Array<WhiteboardElement> | null>(null)
  const providerRef = useRef<unknown | null>(null) // HocuspocusProvider, typed as unknown to avoid import issues
  const supabaseCleanupRef = useRef<(() => void) | null>(null)
  const isLocalUpdateRef = useRef(false)
  const hasChosenModeRef = useRef(false)

  // Get store actions
  const addElement = useWhiteboardStore((s) => s.addElement)
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const removeElements = useWhiteboardStore((s) => s.removeElements)
  const loadState = useWhiteboardStore((s) => s.loadState)
  const setConnected = useCollabStore((s) => s.setConnected)
  const setRemoteUsers = useCollabStore((s) => s.setRemoteUsers)

  // Try Yjs first
  useEffect(() => {
    if (!roomId || hasChosenModeRef.current) return
    hasChosenModeRef.current = true

    let ydoc: Y.Doc | null = null
    let yElements: Y.Array<WhiteboardElement> | null = null
    let provider: unknown = null
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    let settled = false

    const initYjs = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { HocuspocusProvider } = await import('@hocuspocus/provider')

        ydoc = new Y.Doc()
        ydocRef.current = ydoc
        yElements = ydoc.getArray<WhiteboardElement>('elements')
        yElementsRef.current = yElements

        // Get Hocuspocus URL
        const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ||
          (typeof window !== 'undefined'
            ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/hocuspocus`
            : '')

        if (!wsUrl) {
          console.info('[Collab] No Hocuspocus URL — using Supabase fallback')
          initSupabaseFallback()
          return
        }

        // Get auth token
        let token: string | undefined
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey)
            const { data: { session } } = await supabase.auth.getSession()
            token = session?.access_token || undefined
          }
        } catch {
          // No session — connection will fail auth
        }

        provider = new HocuspocusProvider({
          url: wsUrl,
          name: `room-${roomId}`,
          document: ydoc,
          token: token || '',
          parameters: { token, userId, role: userRole },
          connect: false,
          maxBackoffTime: 16000,
        } as ConstructorParameters<typeof HocuspocusProvider>[0])

        providerRef.current = provider

        // Listen for connection status
        ;(provider as { on: (event: string, cb: (e: unknown) => void) => void }).on('status', (event: unknown) => {
          const status = (event as { status: string }).status
          if (status === 'connected' && !settled) {
            settled = true
            if (fallbackTimer) clearTimeout(fallbackTimer)
            console.info('[Collab] Yjs/Hocuspocus connected — using CRDT mode')
            setMode('yjs')
            setIsConnected(true)
            setConnected(true)
            setupYjsSync(ydoc!, yElements!, provider as { awareness: { setLocalState: (s: unknown) => void; getStates: () => Map<number, unknown>; on: (e: string, cb: () => void) => void } })
          } else if (status === 'disconnected' && !settled) {
            // Haven't connected yet — start fallback timer
            console.info('[Collab] Hocuspocus disconnect before connect — will try fallback')
          }
        })

        ;(provider as { on: (event: string, cb: (e: unknown) => void) => void }).on('awareness-change', () => {
          const awareness = (provider as { awareness: { getStates: () => Map<number, unknown> } }).awareness
          if (awareness) {
            const states = awareness.getStates()
            const users: Array<{ id: string; name: string; color: string; role: string; cursor: { x: number; y: number } | null; isHandRaised: boolean }> = []
            states.forEach((state, clientId) => {
              const s = state as { user?: { id: string; name: string; color: string; role: string; cursor: { x: number; y: number } | null; isHandRaised: boolean } }
              if (s.user) {
                users.push({
                  id: s.user.id || String(clientId),
                  name: s.user.name || 'Anonymous',
                  color: s.user.color || '#94a3b8',
                  role: ((s.user.role === 'tutor' || s.user.role === 'student') ? s.user.role : 'student') as 'tutor' | 'student',
                  cursor: s.user.cursor || null,
                  isHandRaised: s.user.isHandRaised || false,
                })
              }
            })
            setRemoteUsers(users as unknown as RemoteUser[])
            setRemoteUserCount(users.length)
          }
        })

        // Set initial awareness
        const awareness = (provider as { awareness: { setLocalState: (s: unknown) => void } }).awareness
        if (awareness) {
          awareness.setLocalState({
            user: { id: userId, name: userName, color: userColor, role: userRole, cursor: null, isHandRaised: false },
          })
        }

        // Attempt connection
        try {
          ;(provider as { connect: () => void }).connect()
        } catch {
          // Will emit disconnected
        }

        // Set a fallback timer: if Hocuspocus doesn't connect within 3s, use Supabase
        fallbackTimer = setTimeout(() => {
          if (!settled) {
            settled = true
            console.info('[Collab] Hocuspocus didn\'t connect in 3s — using Supabase fallback')
            // Disconnect the Hocuspocus provider to stop retry noise
            try {
              ;(provider as { disconnect: () => void })?.disconnect()
            } catch {
              // Already disconnected
            }
            initSupabaseFallback()
          }
        }, 3000)
      } catch (err) {
        console.warn('[Collab] Yjs init failed:', err)
        initSupabaseFallback()
      }
    }

    const initSupabaseFallback = () => {
      setMode('supabase')
      setIsConnected(true)
      setConnected(true)

      // Clean up Yjs resources if they were partially created
      if (ydoc) {
        try { ydoc.destroy() } catch { /* already destroyed */ }
        ydoc = null
        ydocRef.current = null
      }

      // Initialize Supabase Realtime Broadcast
      const store = useWhiteboardStore.getState()
      supabaseCleanupRef.current = initRealtimeSync(roomId, {
        elements: store.elements,
        camera: store.camera,
        pages: store.pages,
        currentPageIndex: store.currentPageIndex,
        addElement: store.addElement,
        updateElement: store.updateElement,
        removeElements: store.removeElements,
        setCamera: store.setCamera,
        loadState: store.loadState,
        setPages: store.setPages,
        setCurrentPageIndex: store.setCurrentPageIndex,
      })
    }

    const setupYjsSync = (
      doc: Y.Doc,
      yArr: Y.Array<WhiteboardElement>,
      prov: { awareness: { setLocalState: (s: unknown) => void; getStates: () => Map<number, unknown>; on: (e: string, cb: () => void) => void } }
    ) => {
      // Push current store elements to Yjs on first sync
      const currentElements = useWhiteboardStore.getState().elements
      if (currentElements.length > 0 && yArr.length === 0) {
        doc.transact(() => {
          yArr.push(currentElements)
        })
      }

      // Listen for remote Yjs updates → update Zustand store
      yArr.observe((event: Y.YArrayEvent<WhiteboardElement>) => {
        if (isLocalUpdateRef.current) return
        isLocalUpdateRef.current = true

        const newElements = yArr.toArray()

        // Determine what changed
        const addedOps = event.changes.delta.filter((d) => d.insert !== undefined)
        const deletedOps = event.changes.delta.filter((d) => d.delete !== undefined)

        for (const op of addedOps) {
          const items = op.insert as WhiteboardElement[]
          if (Array.isArray(items)) {
            items.forEach((el) => addElement(el))
          }
        }

        for (const op of deletedOps) {
          if (op.delete) {
            // We don't know exactly which IDs were deleted, so just reload state
            loadState(newElements)
            break
          }
        }

        // If no specific add/delete ops, the array was replaced — reload
        if (addedOps.length === 0 && deletedOps.length === 0) {
          loadState(newElements)
        }

        isLocalUpdateRef.current = false
      })

      // Listen for store changes → push to Yjs
      // We use a subscription to the store's elements
      const unsub = useWhiteboardStore.subscribe((state, prevState) => {
        if (isLocalUpdateRef.current) return
        if (state.elements === prevState.elements) return

        isLocalUpdateRef.current = true
        const yCurrent = yArr.toArray()
        const storeEls = state.elements

        // Simple diff: if lengths differ or IDs don't match, replace all
        const yIds = new Set(yCurrent.map((e) => e.id))
        const storeIds = new Set(storeEls.map((e) => e.id))
        const sameLength = yCurrent.length === storeEls.length
        const sameIds = yIds.size === storeIds.size && [...yIds].every((id) => storeIds.has(id))

        if (!sameLength || !sameIds) {
          doc.transact(() => {
            yArr.delete(0, yArr.length)
            if (storeEls.length > 0) yArr.push(storeEls)
          })
        } else {
          // Update individual elements in place
          storeEls.forEach((el, i) => {
            if (yCurrent[i] !== el && JSON.stringify(yCurrent[i]) !== JSON.stringify(el)) {
              yArr.delete(i, 1)
              yArr.insert(i, [el])
            }
          })
        }

        isLocalUpdateRef.current = false
      })

      // Store cleanup
      ydocRef.current = doc
      yElementsRef.current = yArr
      // Store the unsubscribe function
      ;(ydocRef as unknown as { _unsub?: () => void })._unsub = unsub
    }

    // Small delay to let the store initialize
    const initTimer = setTimeout(initYjs, 300)

    return () => {
      clearTimeout(initTimer)
      if (fallbackTimer) clearTimeout(fallbackTimer)

      // Clean up Yjs
      const unsub = (ydocRef as unknown as { _unsub?: () => void })._unsub
      if (unsub) unsub()
      if (provider) {
        try { (provider as { destroy: () => void }).destroy() } catch { /* already destroyed */ }
      }
      if (ydocRef.current) {
        try { ydocRef.current.destroy() } catch { /* already destroyed */ }
      }
      ydocRef.current = null
      yElementsRef.current = null
      providerRef.current = null

      // Clean up Supabase fallback
      if (supabaseCleanupRef.current) {
        supabaseCleanupRef.current()
        supabaseCleanupRef.current = null
      }

      setConnected(false)
      setIsConnected(false)
      setRemoteUsers([])
      setRemoteUserCount(0)
      hasChosenModeRef.current = false
    }
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { mode, isConnected, remoteUserCount }
}
