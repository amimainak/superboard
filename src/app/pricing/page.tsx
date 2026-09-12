// ============================================================
// /pricing — Server Component route
// ============================================================
// Exports metadata for SEO (Task #22) and renders the client
// PricingClient (which wraps the hook-using PricingPage in a
// Suspense boundary for useSearchParams).

import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing — Superboard',
  description:
    'Simple, transparent pricing for Superboard. Start free, upgrade when you need more. No hidden fees, cancel anytime.',
}

export default function PricingPage() {
  return <PricingClient />
}
