// ============================================================
// Superboard — Participants Widget
// Shows room participants with real-time awareness from Hocuspocus.
// ============================================================

'use client'

import { useCollabStore } from '@/lib/collab/store'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface ParticipantsWidgetProps {
  roomId: string
  isTutor: boolean
}

export function ParticipantsWidget({ roomId, isTutor }: ParticipantsWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const remoteUsers = useCollabStore((s) => s.remoteUsers)
  const isConnected = useCollabStore((s) => s.isConnected)

  return (
    <div className={`widget-content widget-participants ${isDark ? '' : 'widget-participants-light'}`}>
      <div className={`participants-list ${isDark ? '' : 'participants-list-light'}`}>
        {/* Tutor (always shown) */}
        <div className={`participant-item participant-tutor ${isDark ? '' : 'participant-item-light'}`}>
          <div className="participant-avatar participant-avatar-tutor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="participant-info">
            <div className={`participant-name ${isDark ? '' : 'participant-name-light'}`}>You (Tutor)</div>
            <div className="participant-role">Host</div>
          </div>
          <div className="participant-status participant-status-online" />
        </div>

        {remoteUsers.length === 0 ? (
          <>
            {/* Placeholder when no remote users */}
            <div className={`participants-divider ${isDark ? '' : 'participants-divider-light'}`}>
              <span>Waiting for students to join...</span>
            </div>

            <div className={`participant-item participant-empty ${isDark ? '' : 'participant-item-light'}`}>
              <div className={`participant-avatar participant-avatar-empty ${isDark ? '' : 'participant-avatar-empty-light'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div className="participant-info">
                <div className={`participant-name participant-name-empty ${isDark ? '' : 'participant-name-empty-light'}`}>Student slot</div>
                <div className="participant-role participant-role-empty">
                  Share room link to invite
                </div>
              </div>
            </div>
          </>
        ) : (
          remoteUsers.map((user) => (
            <div key={user.id} className={`participant-item ${isDark ? '' : 'participant-item-light'}`}>
              <div
                className="participant-avatar"
                style={{ backgroundColor: user.color || '#94a3b8' }}
              >
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                  {(user.name || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="participant-info">
                <div className={`participant-name ${isDark ? '' : 'participant-name-light'}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {user.name || 'Anonymous'}
                  {user.isHandRaised && (
                    <span title="Hand raised" style={{ fontSize: 14 }}>✋</span>
                  )}
                </div>
                <div className="participant-role" style={{
                  display: 'inline-block',
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: user.role === 'tutor' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
                  color: user.role === 'tutor' ? '#3b82f6' : '#22c55e',
                }}>
                  {user.role || 'student'}
                </div>
              </div>
              <div className="participant-status participant-status-online" />
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className={`participants-footer ${isDark ? '' : 'participants-footer-light'}`}>
        {isConnected
          ? remoteUsers.length > 0
            ? `Connected — ${remoteUsers.length} other participant${remoteUsers.length === 1 ? '' : 's'}`
            : 'Connected — waiting for others to join'
          : 'Connecting to collaboration server...'}
      </div>
    </div>
  )
}