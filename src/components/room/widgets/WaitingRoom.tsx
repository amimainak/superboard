// ============================================================
// Superboard — Waiting Room Component (Enhanced)
// Full-screen overlay shown to students when the tutor
// hasn't started the session yet.
// Features: branded screen, tutor name, subject, countdown,
// welcome message, and a "Knock" button for chat notification.
// ============================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const sbAny = (sb: any) => sb as any

interface WaitingRoomProps {
  roomId: string
  roomSubject: string
  tutorName?: string | null
  brandingLogo?: string | null
  brandingColor?: string | null
  roomName?: string
}

/** Format seconds into MM:SS */
function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function WaitingRoom({
  roomId,
  roomSubject,
  tutorName,
  brandingLogo,
  brandingColor,
  roomName,
}: WaitingRoomProps) {
  const accent = brandingColor || '#059669'
  const [dotCount, setDotCount] = useState(0)
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [knockSent, setKnockSent] = useState(false)
  const [knockCooldown, setKnockCooldown] = useState(0)
  const [knockSending, setKnockSending] = useState(false)

  // Animated dots: cycle 0 → 3
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4)
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Wait time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Knock cooldown timer
  useEffect(() => {
    if (knockCooldown <= 0) return
    const interval = setInterval(() => {
      setKnockCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [knockCooldown])

  // Knock button: sends a system message to the chat
  const handleKnock = useCallback(async () => {
    if (knockCooldown > 0 || knockSending) return

    setKnockSending(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const label = user?.email
        ? user.email.split('@')[0]
        : 'Student'

      await sbAny(supabase).from('ChatMessage').insert({
        roomId,
        senderLabel: `🔔 ${label}`,
        content: '👋 Knock knock! The student is waiting for you.',
        senderId: user?.id ?? null,
      })

      setKnockSent(true)
      setKnockCooldown(30) // 30s cooldown
    } catch (err) {
      console.error('Failed to send knock:', err)
    } finally {
      setKnockSending(false)
    }
  }, [roomId, knockCooldown, knockSending])

  const dots = '.'.repeat(dotCount)
  const displayName = tutorName || 'your tutor'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <style>{`
        @keyframes waiting-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0.2; }
        }
        @keyframes waiting-fade {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes waiting-glow {
          0%, 100% { box-shadow: 0 0 0 0 ${accent}44; }
          50% { box-shadow: 0 0 0 8px ${accent}00; }
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
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '44px 52px',
          textAlign: 'center',
          maxWidth: 440,
          width: '92%',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          {brandingLogo ? (
            <img
              src={brandingLogo}
              alt="Logo"
              style={{ height: 52, objectFit: 'contain' }}
            />
          ) : (
            <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill={accent} />
              <path
                d="M16 18h24v4H20v4h16v4H20v8h-4V18z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          )}
        </div>

        {/* Welcome message */}
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: 6,
        }}>
          Welcome! 🎉
        </div>

        {/* Tutor name + subject */}
        <div style={{ marginBottom: 6 }}>
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
          <div style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: 4,
          }}>
            {roomName}
          </div>
        )}

        <div style={{
          fontSize: 14,
          color: '#94a3b8',
          marginBottom: 8,
          lineHeight: 1.5,
        }}>
          Your tutor <strong style={{ color: '#e2e8f0' }}>{displayName}</strong> will be with you shortly.
        </div>

        {/* Pulsing green dot + waiting message */}
        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'block',
                position: 'relative',
                zIndex: 1,
              }} />
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
            <span style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 500 }}>
              Waiting for the session to start{dots}
            </span>
          </div>
        </div>

        {/* Countdown timer */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 16,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'ui-monospace, monospace',
            color: '#e2e8f0',
            letterSpacing: '1px',
          }}>
            {formatCountdown(waitSeconds)}
          </span>
        </div>

        {/* Knock button */}
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <button
            onClick={handleKnock}
            disabled={knockCooldown > 0 || knockSending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 10,
              border: `1px solid ${knockCooldown > 0 ? 'rgba(255,255,255,0.06)' : `${accent}40`}`,
              background: knockCooldown > 0
                ? 'rgba(255,255,255,0.03)'
                : `${accent}15`,
              color: knockCooldown > 0 ? '#475569' : accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: knockCooldown > 0 || knockSending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              animation: knockCooldown <= 0 && !knockSent ? `waiting-glow 2s ease-in-out infinite` : 'none',
            }}
          >
            {knockSending ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Sending...
              </>
            ) : knockCooldown > 0 ? (
              <>
                ✅ Knock sent
                <span style={{
                  fontSize: 11,
                  opacity: 0.7,
                  fontFamily: 'ui-monospace, monospace',
                }}>
                  {formatCountdown(knockCooldown)}
                </span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v10l4 4" />
                  <path d="M18 8a6 6 0 1 0-12 0c0 3.09 1.34 5.52 3 7.17V18h6v-2.83A7.97 7.97 0 0 0 18 8z" />
                </svg>
                Knock to notify tutor
              </>
            )}
          </button>
        </div>

        {/* Tip */}
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            💡 Tip: You can practice on the whiteboard while you wait
          </span>
        </div>
      </div>

      {/* Spinner animation keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}