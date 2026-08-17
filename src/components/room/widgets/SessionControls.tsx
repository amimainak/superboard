// ============================================================
// Superboard — Session Controls Widget
// Floating session controls: End Session, timer display,
// student drawing permission toggle (host only)
// ============================================================

'use client'

import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface SessionControlsProps {
  isActive: boolean
  onEndSession: () => void
}

export function SessionControls({ isActive, onEndSession }: SessionControlsProps) {
  const handleEnd = () => {
    if (!confirm('End this session? The room will be deactivated.')) return
    onEndSession()
  }

  const canDraw = useWhiteboardStore((s) => s.canDraw)
  const userRole = useWhiteboardStore((s) => s.userRole)
  const toggleStudentDraw = useWhiteboardStore((s) => s.toggleStudentDraw)

  return (
    <div className="session-controls">
      {isActive ? (
        <>
          <button className="session-btn session-btn-end" onClick={handleEnd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            End Session
          </button>
          {userRole === 'host' && (
            <button
              className="session-btn session-btn-toggle-draw"
              onClick={toggleStudentDraw}
              title={canDraw ? 'Disable student drawing' : 'Enable student drawing'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {canDraw ? (
                  <><path d="M17 3l4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /><path d="M15 5l4 4" /></>
                ) : (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                )}
              </svg>
              {canDraw ? 'Drawing On' : 'Drawing Off'}
            </button>
          )}
        </>
      ) : (
        <div className="session-ended-badge">
          Session Ended
        </div>
      )}
    </div>
  )
}