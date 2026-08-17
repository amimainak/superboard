import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { IndexeddbPersistence } from 'y-indexeddb'
import { useCollabStore } from './store'

let providerInstance: HocuspocusProvider | null = null
let ydocInstance: Y.Doc | null = null
let indexeddbProvider: IndexeddbPersistence | null = null

interface CreateProviderOptions {
  roomId: string
  token?: string // JWT for authenticated tutors; undefined for anonymous students
  onAwarenessChange?: (users: Array<{ id: string; name: string; color: string; role: string; cursor: { x: number; y: number } | null; isHandRaised: boolean }>) => void
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
}

export function createCollabProvider(options: CreateProviderOptions) {
  const { roomId, token, onAwarenessChange, onStatusChange } = options
  const hocuspocusUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL

  // Create Yjs document
  ydocInstance = new Y.Doc()

  // Persist to IndexedDB for offline support
  indexeddbProvider = new IndexeddbPersistence(`superboard-${roomId}`, ydocInstance)
  indexeddbProvider.on('synced', () => {
    console.log('[Collab] IndexedDB synced')
  })

  if (!hocuspocusUrl) {
    console.warn('[Collab] NEXT_PUBLIC_HOCUSPOCUS_URL not set — running in offline mode')
    onStatusChange?.('disconnected')
    return { ydoc: ydocInstance, provider: null, destroy: () => {
      indexeddbProvider?.destroy()
      indexeddbProvider = null
      ydocInstance?.destroy()
      ydocInstance = null
    } }
  }

  // Create Hocuspocus provider
  const collabStore = useCollabStore.getState()

  providerInstance = new HocuspocusProvider({
    url: hocuspocusUrl,
    name: roomId,
    document: ydocInstance,
    token: token || '',
    // Awareness
    onAwarenessChange: ({ states }) => {
      const users = states
        .filter((state) => state.clientId !== providerInstance?.awareness?.clientID)
        .map((state) => {
          const userState = state as unknown as {
            user?: { name: string; color: string; role: string; cursor: { x: number; y: number } | null; isHandRaised: boolean }
          }
          const user = userState.user
          return {
            id: String(state.clientId),
            name: user?.name || 'Anonymous',
            color: user?.color || '#94a3b8',
            role: user?.role || 'student',
            cursor: user?.cursor || null,
            isHandRaised: user?.isHandRaised || false,
          }
        })
      onAwarenessChange?.(users)
    },
    onStatus: ({ status }) => {
      switch (status) {
        case 'connecting':
          onStatusChange?.('connecting')
          break
        case 'connected':
          onStatusChange?.('connected')
          // Set local user awareness
          if (providerInstance) {
            const store = useCollabStore.getState()
            providerInstance.setAwarenessField('user', {
              name: store.userName || 'User',
              color: store.userName ? '' : '', // color assigned by server
              role: store.role,
              cursor: null,
              isHandRaised: false,
            })
          }
          break
        case 'disconnected':
          onStatusChange?.('disconnected')
          break
      }
    },
  })

  return {
    ydoc: ydocInstance,
    provider: providerInstance,
    destroy: () => {
      providerInstance?.destroy()
      providerInstance = null
      indexeddbProvider?.destroy()
      indexeddbProvider = null
      ydocInstance?.destroy()
      ydocInstance = null
    },
  }
}

export function getProvider(): HocuspocusProvider | null {
  return providerInstance
}

export function getYDoc(): Y.Doc | null {
  return ydocInstance
}

export async function getIndexedDBStatus(): Promise<{ synced: boolean; storedUpdates: number }> {
  if (!indexeddbProvider) return { synced: false, storedUpdates: 0 }
  return {
    synced: indexeddbProvider.synced,
    storedUpdates: (indexeddbProvider as any)._storeUpdate?.() ?? 0,
  }
}
