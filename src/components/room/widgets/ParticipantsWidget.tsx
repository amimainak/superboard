// ============================================================
// Superboard — Participants Widget
// Shows room participants. Real-time sync requires Hocuspocus.
// ============================================================

'use client'

interface ParticipantsWidgetProps {
  roomId: string
  isTutor: boolean
}

export function ParticipantsWidget({ roomId, isTutor }: ParticipantsWidgetProps) {
  return (
    <div className="widget-content widget-participants">
      <div className="participants-list">
        {/* Tutor (always shown) */}
        <div className="participant-item participant-tutor">
          <div className="participant-avatar participant-avatar-tutor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="participant-info">
            <div className="participant-name">You (Tutor)</div>
            <div className="participant-role">Host</div>
          </div>
          <div className="participant-status participant-status-online" />
        </div>

        {/* Student slots (placeholder) */}
        <div className="participants-divider">
          <span>Waiting for students to join...</span>
        </div>

        <div className="participant-item participant-empty">
          <div className="participant-avatar participant-avatar-empty">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="participant-info">
            <div className="participant-name participant-name-empty">Student slot</div>
            <div className="participant-role participant-role-empty">
              Share room link to invite
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="participants-footer">
        Real-time participant sync requires Hocuspocus
        <br />
        <span className="participants-footer-sub">Coming in next update</span>
      </div>
    </div>
  )
}
