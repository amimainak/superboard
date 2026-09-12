// ============================================================
// /dashboard — Server Component route
// ============================================================
// Exports metadata for SEO (Task #22) and renders the client
// DashboardClient which dynamically loads AuthGate (ssr:false).

import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard — Superboard',
  description:
    'Your Superboard tutor dashboard — rooms, templates, students, recordings, and billing.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
