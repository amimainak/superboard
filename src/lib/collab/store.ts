import { create } from 'zustand'

export interface RemoteUser {
  id: string
  name: string
  color: string
  role: 'tutor' | 'student'
  cursor: { x: number; y: number } | null
  lastActive: number // timestamp
  isHandRaised: boolean
}

interface CollabStore {
  /** Current user's role in this room */
  role: 'tutor' | 'student'
  setRole: (role: 'tutor' | 'student') => void

  /** Current user's display name */
  userName: string
  setUserName: (name: string) => void

  /** Whether connected to Hocuspocus */
  isConnected: boolean
  setConnected: (connected: boolean) => void

  /** Remote users in the room (from awareness) */
  remoteUsers: RemoteUser[]
  setRemoteUsers: (users: RemoteUser[]) => void
  updateRemoteUser: (id: string, updates: Partial<RemoteUser>) => void
  removeRemoteUser: (id: string) => void

  /** Hand raise state */
  isHandRaised: boolean
  toggleHandRaised: () => void

  /** Connection status message */
  statusMessage: string
  setStatusMessage: (msg: string) => void
}

const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#a855f7', '#6366f1',
]

let colorIndex = 0
export function getNextColor(): string {
  const color = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length]
  colorIndex++
  return color
}

export const useCollabStore = create<CollabStore>((set) => ({
  role: 'tutor',
  setRole: (role) => set({ role }),
  userName: '',
  setUserName: (name) => set({ userName: name }),
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected, statusMessage: isConnected ? 'Connected' : 'Disconnected' }),
  remoteUsers: [],
  setRemoteUsers: (remoteUsers) => set({ remoteUsers }),
  updateRemoteUser: (id, updates) =>
    set((state) => ({
      remoteUsers: state.remoteUsers.map((u) =>
        u.id === id ? { ...u, ...updates, lastActive: Date.now() } : u
      ),
    })),
  removeRemoteUser: (id) =>
    set((state) => ({
      remoteUsers: state.remoteUsers.filter((u) => u.id !== id),
    })),
  isHandRaised: false,
  toggleHandRaised: () => set((s) => ({ isHandRaised: !s.isHandRaised })),
  statusMessage: 'Connecting...',
  setStatusMessage: (statusMessage) => set({ statusMessage }),
}))
