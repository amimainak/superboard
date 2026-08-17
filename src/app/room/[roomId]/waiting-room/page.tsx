'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function WaitingRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'joining'>('waiting')

  useEffect(() => {
    // Try to connect and detect tutor presence
    // For now, this is a static waiting page
    const timer = setTimeout(() => setStatus('connecting'), 1000)
    return () => clearTimeout(timer)
  }, [roomId])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw',
      background: '#0f172a', color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          margin: '0 auto 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Superboard
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
          Waiting for the tutor to start the session...
        </p>

        {/* Loading animation */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24,
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#059669',
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 13, color: '#64748b',
        }}>
          {status === 'waiting' && "Session hasn't started yet. You'll join automatically."}
          {status === 'connecting' && 'Connecting to session...'}
          {status === 'joining' && 'Joining now!'}
        </div>

        <p style={{ fontSize: 11, color: '#475569', marginTop: 24 }}>
          Room: {roomId.slice(0, 8)}...
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}