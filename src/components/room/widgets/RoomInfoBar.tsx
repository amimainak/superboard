// ============================================================
// Superboard — Room Info Bar
// Floating overlay showing room subject + active status
// ============================================================

'use client'

interface RoomInfoBarProps {
  subject: string
  isActive: boolean
}

export function RoomInfoBar({ subject, isActive }: RoomInfoBarProps) {
  return (
    <div className="room-info-bar">
      <span className={[
        'room-info-dot',
        isActive ? 'room-info-dot-active' : 'room-info-dot-inactive',
      ].join(' ')} />
      <span className="room-info-subject">
        {subject || 'Room'}
      </span>
      <span className="room-info-status">
        {isActive ? 'Live' : 'Ended'}
      </span>
    </div>
  )
}
