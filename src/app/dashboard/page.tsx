'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const AuthGate = dynamic(() => import('@/components/auth/AuthGate'), { ssr: false })

export default function DashboardPageWithSuspense() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
    }>
      <AuthGate />
    </Suspense>
  )
}
