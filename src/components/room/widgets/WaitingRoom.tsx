// ============================================================
// Superboard — Waiting Room Component
// Full-screen overlay shown to students when the tutor
// hasn't started the session yet.
// ============================================================

'use client'

import { useState, useEffect } from 'react'

interface WaitingRoomProps {
  roomSubject: string
  brandingLogo?: string | null
  brandingColor?: string | null
  roomName?: string
}

export function WaitingRoom({ roomSubject, brandingLogo, brandingColor, roomName }: WaitingRoomProps) {
  const accent = brandingColor || '#059669'
  const [dotCount, setDotCount] = useState(0)

  // Animated dots: cycle 0 → 3
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4)
    }, 600)
    return () => clearInterval(interval)
  }, [])

  const dots = '.'.repeat(dotCount)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <style>{`
        @keyframes waiting-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.3; }
        }
        @keyframes waiting-fade {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .waiting-pulse-ring {
          animation: waiting-pulse 2s ease-in-out infinite;
        }
        .waiting-dots-char {
          animation: waiting-fade 1.5s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: 16,
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          {brandingLogo ? (
            <img
              src={brandingLogo}
              alt="Logo"
              style={{ height: 56, objectFit: 'contain' }}
            />
          ) : (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill={accent} />
              <path
                d="M16 18h24v4H20v4h16v4H20v8h-4V18z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          )}
        </div>

        {/* Subject & room name */}
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: accent,
              background: `${accent}18`,
              padding: '3px 10px',
              borderRadius: 4,
            }}
          >
            {roomSubject}
          </span>
        </div>
        {roomName && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: 6,
            }}
          >
            {roomName}
          </div>
        )}

        {/* Pulsing green dot + waiting message */}
        <div style={{ marginTop: 28, marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <span
                className="waiting-pulse-ring"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                  zIndex: 0,
                }}
              />
            </span>
            <span style={{ fontSize: 15, color: '#cbd5e1', fontWeight: 500 }}>
              Waiting for the tutor to start the session{dots}
            </span>
          </div>
        </div>

        {/* Tip */}
        <div
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            💡 Tip: You can practice on the whiteboard while you wait
          </span>
        </div>
      </div>
    </div>
  )
}