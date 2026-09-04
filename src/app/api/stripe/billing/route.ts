import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const profile = await db.user.findUnique({
      where: { id: user!.id },
      select: { tier: true, stripeCustomerId: true },
    })

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

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
          subscriptionStatus = sub.status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cpe = (sub as any).current_period_end as number | undefined
          currentPeriodEnd = cpe ? new Date(cpe * 1000).toISOString() : null
        }
      } catch (err) {
        console.warn('[GET /api/stripe/billing] Could not fetch subscription:', err)
      }
    }

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
