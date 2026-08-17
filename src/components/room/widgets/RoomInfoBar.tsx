// ============================================================
// Superboard — Room Info Bar
// Floating overlay showing room subject + active status
// ============================================================

'use client'

import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface RoomInfoBarProps {
  subject: string
  isActive: boolean
}

export function RoomInfoBar({ subject, isActive }: RoomInfoBarProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  return (
    <div className={`room-info-bar ${isDark ? '' : 'room-info-bar-light'}`}>
      <span className={[
        'room-info-dot',
        isActive ? 'room-info-dot-active' : 'room-info-dot-inactive',
      ].join(' ')} />
      <span className={`room-info-subject ${isDark ? '' : 'room-info-subject-light'}`}>
        {subject || 'Room'}
      </span>
      <span className={`room-info-status ${isDark ? '' : 'room-info-status-light'}`}>
        {isActive ? 'Live' : 'Ended'}
      </span>
    </div>
  )
}
