'use client'

import { useCollabStore } from '@/lib/collab/store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

export function ConnectionStatus() {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const isConnected = useCollabStore((s) => s.isConnected)
  const statusMessage = useCollabStore((s) => s.statusMessage)
  const remoteCount = useCollabStore((s) => s.remoteUsers.length)

  return (
    <div className={"connection-status" + (isDark ? '' : ' connection-status-light')}>
      <span className="connection-status-dot" style={{
        background: isConnected ? '#22c55e' : '#f59e0b',
        boxShadow: isConnected ? '0 0 4px rgba(34,197,94,0.5)' : '0 0 4px rgba(245,158,11,0.5)',
      }} />
      <span>{statusMessage}</span>
      {remoteCount > 0 && (
        <span className="connection-status-count">({remoteCount} {remoteCount === 1 ? 'other' : 'others'})</span>
      )}
    </div>
  )
}
