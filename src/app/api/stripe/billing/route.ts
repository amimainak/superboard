import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('User')
      .select('tier, stripeCustomerId')
      .eq('id', user!.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let subscriptionStatus: string | null = null
    let currentPeriodEnd: string | null = null

    if (profile.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripeCustomerId,
          status: 'all',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0]
          subscriptionStatus = sub.status // 'active' | 'canceled' | 'past_due' | ...
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cpe = (sub as any).current_period_end as number | undefined
          currentPeriodEnd = cpe
            ? new Date(cpe * 1000).toISOString()
            : null
        }
      } catch (err) {
        // Stripe may not be configured (test mode); return tier only
        console.warn('[GET /api/stripe/billing] Could not fetch subscription:', err)
      }
    }

    // Mask the customer ID: show first 4 and last 4 chars only
    const rawId = profile.stripeCustomerId || ''
    const maskedCustomerId = rawId.length > 8
      ? `${rawId.slice(0, 4)}${'•'.repeat(rawId.length - 8)}${rawId.slice(-4)}`
      : rawId || null

    return NextResponse.json({
      tier: profile.tier,
      subscriptionStatus,
      currentPeriodEnd,
      stripeCustomerId: maskedCustomerId,
    })
  } catch (err: unknown) {
    console.error('[GET /api/stripe/billing]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
