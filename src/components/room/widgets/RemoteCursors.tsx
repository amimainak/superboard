'use client'

import { useEffect, useState } from 'react'
import { useCollabStore, type RemoteUser } from '@/lib/collab/store'

interface RemoteCursorsProps {
  // Offset from the whiteboard container's top-left
  containerRef: React.RefObject<HTMLDivElement | null>
  camera: { x: number; y: number; zoom: number }
}

export function RemoteCursors({ containerRef, camera }: RemoteCursorsProps) {
  const remoteUsers = useCollabStore((s) => s.remoteUsers)

  // Prune users inactive for 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const store = useCollabStore.getState()
      const pruned = store.remoteUsers.filter((u) => now - u.lastActive < 30000)
      if (pruned.length !== store.remoteUsers.length) {
        store.setRemoteUsers(pruned)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (remoteUsers.length === 0) return null

  // Transform cursor position from whiteboard space to screen space
  const transformX = (wx: number) => wx * camera.zoom + camera.x
  const transformY = (wy: number) => wy * camera.zoom + camera.y

  return (
    <div className="remote-cursors" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 150 }}>
      {remoteUsers.map((user) => {
        if (!user.cursor) return null
        const sx = transformX(user.cursor.x)
        const sy = transformY(user.cursor.y)

        return (
          <div
            key={user.id}
            className="remote-cursor"
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              transform: 'translate(-2px, -2px)',
              transition: 'left 0.1s ease, top 0.1s ease',
            }}
          >
            {/* Cursor dot */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="3" r="3" fill={user.color} />
              <path d="M3 6v7l2.5-3 3.5 0.5 -5-4.5z" fill={user.color} opacity="0.8" />
            </svg>
            {/* Name label */}
            <div
              className="remote-cursor-label"
              style={{
                position: 'absolute',
                left: 14,
                top: 10,
                padding: '1px 6px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: user.color,
                color: '#fff',
                opacity: 0.9,
                pointerEvents: 'none',
              }}
            >
              {user.name}
              {user.isHandRaised && ' ✋'}
            </div>
          </div>
        )
      })}
    </div>
  )
}