// ============================================================
// Superboard — Supabase Realtime Broadcast Sync
// Temporary collaboration layer: broadcasts element CRUD +
// camera moves via Supabase Realtime Broadcast channel.
// ============================================================

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { WhiteboardElement, Camera } from '@/lib/whiteboard/types'

type BroadcastEvent =
  | { type: 'element-add'; payload: WhiteboardElement }
  | { type: 'element-update'; payload: { id: string; updates: Partial<WhiteboardElement> } }
  | { type: 'element-delete'; payload: { ids: string[] } }
  | { type: 'camera-move'; payload: Camera }
  | { type: 'page-add'; payload: { id: string; name: string; index: number } }
  | { type: 'page-switch'; payload: { index: number } }
  | { type: 'full-sync-request' }
  | { type: 'full-sync-response'; payload: { elements: WhiteboardElement[]; camera: Camera; pages: { id: string; name: string; index: number }[]; currentPageIndex: number } }

// Generate a random user ID for this browser session
const PEER_ID = typeof window !== 'undefined'
  ? `peer-${Math.random().toString(36).slice(2, 8)}`
  : 'peer-server'

interface WhiteboardStoreLike {
  elements: WhiteboardElement[]
  camera: Camera
  pages: { id: string; name: string; index: number }[]
  currentPageIndex: number
  addElement: (el: WhiteboardElement) => void
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void
  removeElements: (ids: string[]) => void
  setCamera: (cam: Partial<Camera>) => void
  loadState: (elements: WhiteboardElement[]) => void
  setPages: (pages: { id: string; name: string; index: number }[]) => void
  setCurrentPageIndex: (index: number) => void
}

/**
 * Initialize Supabase Realtime Broadcast sync for a room.
 * Returns a cleanup function.
 */
export function initRealtimeSync(
  roomId: string,
  store: WhiteboardStoreLike
): () => void {
  let syncedOnce = false
  const supabase = getSupabaseBrowserClient()
  const channelName = `room:${roomId}`

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false }, // Don't receive own messages
    },
  })

  // Subscribe to broadcast messages
  channel.on('broadcast', { event: '*' }, (message: { payload: BroadcastEvent & { peerId: string } }) => {
    const { payload } = message
    // Ignore messages from ourselves (just in case self:false doesn't work)
    if (payload.peerId === PEER_ID) return

    switch (payload.type) {
      case 'element-add': {
        // Don't add if element already exists
        const exists = store.elements.some((el) => el.id === payload.payload.id)
        if (!exists) {
          store.addElement(payload.payload)
        }
        break
      }
      case 'element-update': {
        const { id, updates } = payload.payload
        // Only update if element exists
        const exists = store.elements.some((el) => el.id === id)
        if (exists) {
          store.updateElement(id, updates)
        }
        break
      }
      case 'element-delete': {
        // Only delete elements that exist
        const existingIds = payload.payload.ids.filter((id) =>
          store.elements.some((el) => el.id === id)
        )
        if (existingIds.length > 0) {
          store.removeElements(existingIds)
        }
        break
      }
      case 'camera-move': {
        store.setCamera(payload.payload)
        break
      }
      case 'page-add': {
        const exists = store.pages.some((p) => p.id === payload.payload.id)
        if (!exists) {
          store.setPages([...store.pages, payload.payload])
        }
        break
      }
      case 'page-switch': {
        store.setCurrentPageIndex(payload.payload.index)
        break
      }
      case 'full-sync-request': {
        // Respond with our current state
        channel.send({
          type: 'broadcast',
          event: 'sync',
          payload: {
            type: 'full-sync-response',
            peerId: PEER_ID,
            payload: {
              elements: store.elements,
              camera: store.camera,
              pages: store.pages,
              currentPageIndex: store.currentPageIndex,
            },
          },
        })
        break
      }
      case 'full-sync-response': {
        const { elements, camera, pages, currentPageIndex } = payload.payload
        if (!syncedOnce || elements.length > store.elements.length) {
          if (elements.length > 0) {
            store.loadState(elements)
          }
          if (pages && pages.length > 0) {
            store.setPages(pages)
          }
          if (currentPageIndex !== undefined) {
            store.setCurrentPageIndex(currentPageIndex)
          }
          syncedOnce = true
        }
        break
      }
    }
  })

  channel.subscribe(async (status: string) => {
    if (status === 'SUBSCRIBED') {
      // Request a full sync from existing peers
      channel.send({
        type: 'broadcast',
        event: 'sync',
        payload: { type: 'full-sync-request', peerId: PEER_ID },
      })
    }
  })

  // --- Watch store for local changes and broadcast them ---
  let prevElementsJson = JSON.stringify(store.elements)
  let prevCameraJson = JSON.stringify(store.camera)

  const broadcastMsg = (msg: BroadcastEvent) => {
    channel.send({
      type: 'broadcast',
      event: 'sync',
      payload: { ...msg, peerId: PEER_ID },
    })
  }

  // Poll store changes at 60ms interval (lightweight approach)
  // This avoids deep store subscriptions and works with Zustand's immutable updates
  const interval = setInterval(() => {
    const state = (store as any).getState ? (store as any).getState() : store
    if (!state) return

    const els = state.elements || store.elements
    const cam = state.camera || store.camera

    const elsJson = JSON.stringify(els)
    const camJson = JSON.stringify(cam)

    // Detect element changes
    if (elsJson !== prevElementsJson) {
      const prevEls: WhiteboardElement[] = JSON.parse(prevElementsJson)
      const currEls: WhiteboardElement[] = els

      const prevMap = new Map(prevEls.map(el => [el.id, JSON.stringify(el)]))
      const currMap = new Map(currEls.map(el => [el.id, JSON.stringify(el)]))

      // Added
      for (const [id] of currMap) {
        if (!prevMap.has(id)) {
          broadcastMsg({ type: 'element-add', payload: currEls.find(e => e.id === id)! })
        }
      }

      // Deleted
      for (const [id] of prevMap) {
        if (!currMap.has(id)) {
          broadcastMsg({ type: 'element-delete', payload: { ids: [id] } })
        }
      }

      // Updated
      for (const [id, currJson] of currMap) {
        const prevJson = prevMap.get(id)
        if (prevJson !== undefined && currJson !== prevJson) {
          broadcastMsg({ type: 'element-update', payload: { id, updates: currEls.find(e => e.id === id)! } })
        }
      }

      prevElementsJson = elsJson
    }

    // Detect camera changes
    if (camJson !== prevCameraJson) {
      broadcastMsg({ type: 'camera-move', payload: cam })
      prevCameraJson = camJson
    }
  }, 60)

  // Cleanup function
  return () => {
    clearInterval(interval)
    supabase.removeChannel(channel)
  }
}
