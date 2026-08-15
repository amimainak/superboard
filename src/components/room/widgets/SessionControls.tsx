// ============================================================
// Superboard — Session Controls Widget
// Floating session controls: End Session, timer display
// ============================================================

'use client'

interface SessionControlsProps {
  isActive: boolean
  onEndSession: () => void
}

export function SessionControls({ isActive, onEndSession }: SessionControlsProps) {
  const handleEnd = () => {
    if (!confirm('End this session? The room will be deactivated.')) return
    onEndSession()
  }

  return (
    <div className="session-controls">
      {isActive ? (
        <button className="session-btn session-btn-end" onClick={handleEnd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
          End Session
        </button>
      ) : (
        <div className="session-ended-badge">
          Session Ended
        </div>
      )}
    </div>
  )
}
