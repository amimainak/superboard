'use client'

// ============================================================
// Global Error Boundary — catches unhandled errors in any route
// ============================================================

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#f8fafc',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 400, textAlign: 'center' }}>
        An unexpected error occurred. Try refreshing the page — if the problem persists, contact support.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={reset} className="rounded-xl">
          Try again
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={() => window.location.href = '/dashboard'}>
          Go to dashboard
        </Button>
      </div>
    </div>
  )
}
