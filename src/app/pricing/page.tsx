'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, X, Sparkles, Building2, ArrowLeft } from 'lucide-react'
import type { Tier } from '@/lib/validations'
import type { FeatureName } from '@/lib/features'
import { hasFeature, getTierPrice, getTierLabel } from '@/lib/features'

interface FeatureRow {
  name: string
  feature: FeatureName
  freeDetail: string
}

const FEATURE_ROWS: FeatureRow[] = [
  { name: 'Video calls', feature: 'video_call', freeDetail: '120 min/week' },
  { name: 'Unlimited video', feature: 'video_unlimited', freeDetail: '' },
  { name: 'AI assistant', feature: 'ai_assistant', freeDetail: '10 credits/week' },
  { name: 'Extra AI credits', feature: 'ai_credits', freeDetail: '' },
  { name: 'Subject toolkits', feature: 'subject_toolkits', freeDetail: 'Current subject' },
  { name: 'File uploads', feature: 'file_uploads', freeDetail: '' },
  { name: 'Save boards', feature: 'save_boards', freeDetail: '' },
  { name: 'Templates', feature: 'templates', freeDetail: '' },
  { name: 'Function Plotter', feature: 'function_plotter', freeDetail: 'All tiers' },
  { name: 'AI Math OCR', feature: 'ai_math_ocr', freeDetail: '' },
  { name: 'PDF export', feature: 'pdf_export', freeDetail: '' },
  { name: 'Branded PDF', feature: 'pdf_branded', freeDetail: '' },
  { name: 'White-label mode', feature: 'white_label', freeDetail: '' },
  { name: 'Sub-tutor invites', feature: 'sub_tutor_invites', freeDetail: '' },
]

const TIERS: Tier[] = ['FREE', 'PRO', 'AGENCY']

const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: "Yes! You can upgrade or downgrade at any time from your billing page. When upgrading, you'll be charged a prorated amount. When downgrading, the change takes effect at the end of your billing period.",
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free plan is free forever with limited features. We don\'t offer a paid trial, but you can upgrade and downgrade whenever you want \u2014 no contracts, cancel anytime.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) via Stripe. Enterprise customers can also pay by invoice \u2014 contact us for details.',
  },
  {
    q: 'What happens when I cancel?',
    a: 'Your account reverts to the Free plan at the end of your current billing period. All your saved boards and templates are preserved, but premium features will be locked.',
  },
]

function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [annual, setAnnual] = useState(false)
  const [currentTier, setCurrentTier] = useState<Tier>('FREE')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const cancelled = searchParams.get('cancelled') === 'true'

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.tier) setCurrentTier(p.tier as Tier)
      })
      .catch(() => { /* not logged in */ })
  }, [])

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

  const getPrice = (tier: Tier) => {
    if (tier === 'FREE') return '$0'
    if (annual) {
      return tier === 'PRO' ? '$15/mo' : '$31/mo'
    }
    return getTierPrice(tier)
  }

  const getAnnualNote = (tier: Tier) => {
    if (!annual || tier === 'FREE') return null
    return tier === 'PRO' ? 'Billed $180/year (save $48)' : 'Billed $372/year (save $96)'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Superboard
          </button>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>

          {cancelled && (
            <div className="mx-auto mt-6 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
              Checkout was cancelled. No charges were made.
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-11 rounded-full transition-colors ${annual ? 'bg-emerald-600' : 'bg-border'}`}
              role="switch"
              aria-checked={annual}
              aria-label="Toggle annual pricing"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm ${annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              Annual{' '}
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => {
            const isCurrent = tier === currentTier
            const isPopular = tier === 'PRO'
            const isAgency = tier === 'AGENCY'
            const isFree = tier === 'FREE'

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                  isPopular
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'border-border'
                } ${isCurrent ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {isFree && <Sparkles size={18} className="text-slate-400" />}
                    {isPopular && <Sparkles size={18} className="text-emerald-500" />}
                    {isAgency && <Building2 size={18} className="text-amber-500" />}
                    <h2 className="text-xl font-bold">{getTierLabel(tier)}</h2>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{getPrice(tier)}</span>
                  </div>
                  {getAnnualNote(tier) && (
                    <p className="mt-1 text-xs text-muted-foreground">{getAnnualNote(tier)}</p>
                  )}
                </div>

                <div className="mb-8">
                  {isFree ? (
                    <button
                      onClick={() => router.push('/signup')}
                      disabled={isCurrent}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCurrent ? 'Current Plan' : 'Get Started'}
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier as 'PRO' | 'AGENCY')}
                      disabled={checkoutLoading !== null}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {checkoutLoading === tier ? 'Opening checkout...' : 'Upgrade'}
                    </button>
                  )}
                </div>

                <ul className="flex flex-col gap-3 text-sm">
                  {FEATURE_ROWS.map((row) => {
                    const enabled = hasFeature(row.feature, tier)
                    return (
                      <li key={row.name} className="flex items-start gap-2.5">
                        {enabled ? (
                          <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        ) : (
                          <X size={16} className="mt-0.5 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={enabled ? 'text-foreground' : 'text-muted-foreground/60'}>
                          {row.name}
                          {!enabled && isFree && row.freeDetail && (
                            <span className="ml-1 text-xs">({row.freeDetail})</span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        <section className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-border p-5"
              >
                <h3 className="mb-2 text-sm font-semibold">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Superboard \u2014 Built for tutors who want to teach, not fight with tools.
      </footer>
    </div>
  )
}

export default function PricingPageWithSuspense() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
      <PricingPage />
    </Suspense>
  )
}
