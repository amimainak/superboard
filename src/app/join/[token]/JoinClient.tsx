'use client'

// ============================================================
// JoinClient — handles the actual room join + UI states
// F-09: Branded with the tutor's logo + display name
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Status =
  | 'LINK_VALID'        // token OK, attempting to join
  | 'JOINING'           // fetch in flight
  | 'REDIRECTING'       // got roomId, navigating
  | 'NO_ACTIVE_LESSON'  // 409 — waiting screen
  | 'INVALID_LINK'      // 404
  | 'ACCOUNT_PAUSED'    // 403
  | 'ERROR'             // network / unknown

interface Branding {
  displayName: string
  logoUrl: string | null
  color: string
  isPro: boolean
}

interface Props {
  initialStatus: Status
  studentName: string | null
  token?: string
  branding: Branding | null
}

export default function JoinClient({ initialStatus, studentName, token, branding }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialStatus)

  const attemptJoin = useCallback(async () => {
    if (!token) return
    setStatus('JOINING')
    try {
      const res = await fetch('/api/room/join-by-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('REDIRECTING')
        router.push(`/room/${data.roomId}`)
        return
      }

      // Map error codes to UI states
      if (data.error === 'NO_ACTIVE_LESSON') {
        setStatus('NO_ACTIVE_LESSON')
      } else if (data.error === 'INVALID_LINK') {
        setStatus('INVALID_LINK')
      } else if (data.error === 'ACCOUNT_PAUSED') {
        setStatus('ACCOUNT_PAUSED')
      } else {
        setStatus('ERROR')
      }
    } catch {
      setStatus('ERROR')
    }
  }, [token, router])

  // Branding helpers
  const brandColor = branding?.color || '#059669'
  const brandName = branding?.displayName || 'Superboard'
  const isPro = branding?.isPro ?? false

  // Auto-attempt on mount if the link is valid
  useEffect(() => {
    if (initialStatus === 'LINK_VALID') {
      attemptJoin()
    }
  }, [initialStatus, attemptJoin])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 24,
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
        color: '#1e293b',
        textAlign: 'center',
      }}
    >
      {/* Brand logo — tutor's logo if Pro+uploaded, else brand-colored mark */}
      {branding?.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt={brandName}
          style={{
            width: 64, height: 64, borderRadius: 16, objectFit: 'cover',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${brandColor}, #0891b2)`,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${brandColor}40`,
          }}
        >
          <span style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>
            {brandName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Brand name */}
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px', fontWeight: 500 }}>
        {brandName}
      </p>

      {/* JOINING / LINK_VALID — spinner */}
      {(status === 'LINK_VALID' || status === 'JOINING' || status === 'REDIRECTING') && (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
            {studentName ? `Hi ${studentName.split(' ')[0]}!` : 'Hi!'}
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 24px' }}>
            {status === 'REDIRECTING' ? 'Taking you to your lesson...' : 'Looking for your lesson...'}
          </p>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #d1fae5',
              borderTopColor: '#059669',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {/* NO_ACTIVE_LESSON — waiting screen */}
      {status === 'NO_ACTIVE_LESSON' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            {studentName ? `Hi ${studentName.split(' ')[0]}!` : 'Hi!'}
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 8px', maxWidth: 380 }}>
            No lesson in progress right now.
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px', maxWidth: 380 }}>
            Your tutor will start one soon — bookmark this page and come back when they&apos;re ready.
          </p>
          <button
            onClick={attemptJoin}
            style={{
              background: brandColor,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            }}
          >
            Try again
          </button>
        </>
      )}

      {/* INVALID_LINK */}
      {status === 'INVALID_LINK' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            This link is no longer valid.
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 380 }}>
            Please ask your tutor for a fresh link.
          </p>
        </>
      )}

      {/* ACCOUNT_PAUSED */}
      {status === 'ACCOUNT_PAUSED' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            Your account is currently paused.
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 380 }}>
            Please contact your tutor.
          </p>
        </>
      )}

      {/* ERROR */}
      {status === 'ERROR' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            Something went wrong.
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 24px', maxWidth: 380 }}>
            Please try again in a moment.
          </p>
          <button
            onClick={attemptJoin}
            style={{
              background: brandColor,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${brandColor}4d`,
            }}
          >
            Try again
          </button>
        </>
      )}

      {/* F-09: "Powered by" footer for non-Pro tutors */}
      {!isPro && (
        <p style={{ fontSize: 11, color: '#cbd5e1', margin: '40px 0 0' }}>
          Powered by <span style={{ fontWeight: 600, color: '#94a3b8' }}>Superboard</span>
        </p>
      )}
    </div>
  )
}
