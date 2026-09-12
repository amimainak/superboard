// ============================================================
// DashboardClient — client component for the dashboard page
// ============================================================
// Extracted from src/app/dashboard/page.tsx so that page.tsx can
// be a Server Component (which is required to export `metadata`).
// `next/dynamic` with `ssr: false` is not allowed in Server
// Components, so the dynamic AuthGate import lives here.

'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const AuthGate = dynamic(() => import('@/components/auth/AuthGate'), { ssr: false })

export default function DashboardClient() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
    }>
      <AuthGate />
    </Suspense>
  )
}
