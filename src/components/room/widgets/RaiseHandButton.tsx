'use client'

import { useCollabStore } from '@/lib/collab/store'

export function RaiseHandButton() {
  const isHandRaised = useCollabStore((s) => s.isHandRaised)
  const toggleHandRaised = useCollabStore((s) => s.toggleHandRaised)

  return (
    <button
      onClick={toggleHandRaised}
      title={isHandRaised ? 'Lower hand' : 'Raise hand'}
      className="raise-hand-btn"
      style={{
        width: 36, height: 36, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isHandRaised ? 'rgba(234, 179, 8, 0.2)' : 'rgba(15, 23, 42, 0.8)',
        border: isHandRaised ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        color: isHandRaised ? '#facc15' : '#94a3b8',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.15s ease',
        fontSize: 16,
      }}
    >
      ✋
    </button>
  )
}