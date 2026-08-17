'use client'

import { useCollabStore } from '@/lib/collab/store'

export function ConnectionStatus() {
  const isConnected = useCollabStore((s) => s.isConnected)
  const statusMessage = useCollabStore((s) => s.statusMessage)
  const remoteCount = useCollabStore((s) => s.remoteUsers.length)

  return (
    <div className="connection-status" style={{
      position: 'absolute',
      bottom: 8,
      left: 56,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 8px',
      borderRadius: 4,
      fontSize: 10,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      color: '#94a3b8',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isConnected ? '#22c55e' : '#f59e0b',
        boxShadow: isConnected ? '0 0 4px rgba(34,197,94,0.5)' : '0 0 4px rgba(245,158,11,0.5)',
      }} />
      <span>{statusMessage}</span>
      {remoteCount > 0 && (
        <span style={{ color: '#64748b' }}>({remoteCount} {remoteCount === 1 ? 'other' : 'others'})</span>
      )}
    </div>
  )
}