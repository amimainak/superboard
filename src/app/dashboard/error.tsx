'use client'

// ============================================================
// Dashboard Error Boundary — catches errors in the dashboard
// ============================================================

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: 24, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
        Dashboard error
      </h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        Something broke in this section. Try again or reload the page.
      </p>
      <Button onClick={reset} size="sm" className="rounded-xl">
        Try again
      </Button>
    </div>
  )
}
