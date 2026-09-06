'use client'

// ============================================================
// UnsubscribeClient — handles the confirm action + UI states
// ============================================================

import { useState } from 'react'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  status: 'confirm' | 'invalid' | 'already'
  email: string | null
  token?: string
}

export default function UnsubscribeClient({ status, email, token }: Props) {
  const [action, setAction] = useState<'idle' | 'submitting' | 'done'>('idle')

  const handleConfirm = async () => {
    if (!token) return
    setAction('submitting')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        setAction('done')
      } else {
        setAction('idle')
        alert('Something went wrong. Please try again or contact your tutor.')
      }
    } catch {
      setAction('idle')
      alert('Network error. Please try again.')
    }
  }

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
      {/* Logo */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      </div>

      {/* CONFIRM */}
      {status === 'confirm' && action === 'idle' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            Unsubscribe from Superboard emails
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 8px', maxWidth: 380 }}>
            We&apos;ll stop sending homework notifications and review alerts to:
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 24px' }}>{email}</p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConfirm}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}
            >
              Yes, unsubscribe me
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 24, maxWidth: 380 }}>
            You&apos;ll still receive essential transactional emails (like homework being assigned to your child). To stop those too, contact your tutor directly.
          </p>
        </>
      )}

      {/* SUBMITTING */}
      {status === 'confirm' && action === 'submitting' && (
        <>
          <Loader2 style={{ width: 32, height: 32, color: '#059669', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 16, color: '#64748b' }}>Processing...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {/* DONE */}
      {(status === 'confirm' && action === 'done') || status === 'already' ? (
        <>
          <CheckCircle style={{ width: 48, height: 48, color: '#059669', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            {status === 'already' ? 'Already unsubscribed' : 'You&apos;re unsubscribed'}
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 24px', maxWidth: 380 }}>
            {email && <>We won&apos;t send homework notifications or review alerts to <strong>{email}</strong> anymore.</>}
            {!email && 'We won\'t send you homework notifications or review alerts anymore.'}
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 380 }}>
            Changed your mind? Contact your tutor — they can re-enable notifications for you.
          </p>
        </>
      ) : null}

      {/* INVALID */}
      {status === 'invalid' && (
        <>
          <XCircle style={{ width: 48, height: 48, color: '#dc2626', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            This unsubscribe link isn&apos;t valid
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, maxWidth: 380 }}>
            The link may have expired or was already used. Contact your tutor if you&apos;re still receiving emails you don&apos;t want.
          </p>
        </>
      )}
    </div>
  )
}
