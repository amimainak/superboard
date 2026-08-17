'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Clock,
  CalendarDays,
  FileText,
} from 'lucide-react'
import { getTierLabel, getTierPrice, getFeatureLimit, type FeatureName } from '@/lib/features'
import type { Tier } from '@/lib/validations'

interface BillingData {
  tier: string
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
}

const USAGE_FEATURES: { feature: FeatureName; label: string; unit: string }[] = [
  { feature: 'video_call', label: 'Video minutes used', unit: 'min/week' },
  { feature: 'ai_assistant', label: 'AI credits used', unit: 'credits/week' },
]

const PLACEHOLDER_INVOICES = [
  { id: 'inv_1', date: '2026-08-01', amount: '$19.00', status: 'Paid' },
  { id: 'inv_2', date: '2026-07-01', amount: '$19.00', status: 'Paid' },
  { id: 'inv_3', date: '2026-06-01', amount: '$19.00', status: 'Paid' },
]

export default function BillingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/billing')
      if (!res.ok) throw new Error('Failed to load billing')
      const data = await res.json()
      setBilling(data)
    } catch {
      setError('Could not load billing information')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBilling() }, [loadBilling])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not open billing portal')
      }
    } catch {
      alert('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async (tier: 'PRO' | 'AGENCY') => {
    setCheckoutLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch {
      alert('Failed to start checkout')
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tier = (billing?.tier ?? 'FREE') as Tier
  const isPaid = tier !== 'FREE'
  const isActive = billing?.subscriptionStatus === 'active'
  const isPastDue = billing?.subscriptionStatus === 'past_due'
  const isCancelled = billing?.subscriptionStatus === 'canceled'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <span className="text-sm font-semibold">Billing</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Current Plan Card */}
        <div className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CreditCard size={18} className="text-emerald-500" />
            Current Plan
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                {tier === 'PRO' && <Sparkles size={18} className="text-emerald-500" />}
                {tier === 'AGENCY' && <Building2 size={18} className="text-amber-500" />}
                <span className="text-2xl font-bold">{getTierLabel(tier)}</span>
                <span className="text-lg text-muted-foreground">{getTierPrice(tier)}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                {isPaid && billing?.subscriptionStatus && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : isPastDue
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  }`}>
                    {isActive && <CheckCircle2 size={12} />}
                    {isPastDue && <AlertCircle size={12} />}
                    {isCancelled && <Clock size={12} />}
                    {billing.subscriptionStatus === 'active'
                      ? 'Active'
                      : billing.subscriptionStatus === 'past_due'
                        ? 'Past Due'
                        : billing.subscriptionStatus === 'canceled'
                          ? 'Cancelled'
                          : billing.subscriptionStatus}
                  </span>
                )}
                {billing?.currentPeriodEnd && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isPaid && (
                <>
                  <button
                    onClick={() => handleUpgrade('PRO')}
                    disabled={checkoutLoading !== null}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading === 'PRO' ? 'Loading...' : 'Upgrade to Pro'}
                  </button>
                  <button
                    onClick={() => handleUpgrade('AGENCY')}
                    disabled={checkoutLoading !== null}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading === 'AGENCY' ? 'Loading...' : 'Upgrade to Agency'}
                  </button>
                </>
              )}
              {isPaid && (
                <>
                  {tier === 'PRO' && (
                    <button
                      onClick={() => handleUpgrade('AGENCY')}
                      disabled={checkoutLoading !== null}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      {checkoutLoading === 'AGENCY' ? 'Loading...' : 'Upgrade to Agency'}
                    </button>
                  )}
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    Manage Billing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Usage Meters */}
        <div className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Usage This Period</h2>
          <div className="space-y-4">
            {USAGE_FEATURES.map(({ feature, label, unit }) => {
              const limit = getFeatureLimit(feature, tier)
              // Simulated usage for display — real data would come from UsageLog
              const used = tier === 'FREE' ? 45 : tier === 'PRO' ? 32 : 18
              const max = limit ?? 999
              const pct = Math.min((used / max) * 100, 100)

              return (
                <div key={feature}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      {used} / {limit ?? 'Unlimited'} {unit}
                    </span>
                  </div>
                  {limit && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Invoice History */}
        <div className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText size={18} className="text-muted-foreground" />
            Invoice History
          </h2>
          {isPaid ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {PLACEHOLDER_INVOICES.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50">
                      <td className="py-3">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="py-3">{inv.amount}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          <CheckCircle2 size={10} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Invoice download links will appear here after your first billing cycle.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No invoices yet. Upgrade to a paid plan to see your billing history.
            </p>
          )}
        </div>

        {/* Quick link to pricing */}
        <div className="text-center">
          <button
            onClick={() => router.push('/pricing')}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Compare all plans
          </button>
        </div>
      </main>
    </div>
  )
}
