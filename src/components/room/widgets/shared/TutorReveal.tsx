'use client'

import React, { useState } from 'react'

// ============================================================
// TutorReveal — wraps diagnostic results so the tutor sees them
// first, then can click "Show to Student" to reveal on the
// shared whiteboard.  Demonstration tools do NOT use this.
// ============================================================

interface TutorRevealProps {
  children: React.ReactNode
  isDark: boolean
  label?: string
}

export function TutorReveal({ children, isDark, label = 'Results' }: TutorRevealProps) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return <>{children}</>
  }

  return (
    <div style={{
      borderRadius: 8,
      border: '1px solid ' + (isDark ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.2)'),
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: isDark ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? '#34d399' : '#059669',
          }}>{label}</span>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
            padding: '1px 5px',
            borderRadius: 3,
            background: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.1)',
            color: isDark ? '#fbbf24' : '#d97706',
          }}>Tutor Only</span>
        </div>
        <button
          onClick={() => setRevealed(true)}
          style={{
            padding: '4px 10px',
            borderRadius: 5,
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            background: 'rgba(5,150,105,0.15)',
            border: '1px solid rgba(5,150,105,0.3)',
            color: '#34d399',
          }}
        >
          Show to Student
        </button>
      </div>
      <div style={{
        padding: '12px',
        textAlign: 'center' as const,
        fontSize: 10,
        color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
      }}>
        Results hidden — click "Show to Student" to reveal
      </div>
    </div>
  )
}
