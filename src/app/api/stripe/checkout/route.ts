import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { stripe, TIER_PRICE_MAP } from '@/lib/stripe'
import { db } from '@/lib/db'

const VALID_TIERS = ['PRO', 'AGENCY'] as const
type TierParam = (typeof VALID_TIERS)[number]

export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const body = await request.json()
    const tier: string = body?.tier
    if (!tier || !VALID_TIERS.includes(tier as TierParam)) {
      return NextResponse.json({ error: 'Invalid tier. Must be PRO or AGENCY.' }, { status: 400 })
    }

    const priceId = TIER_PRICE_MAP[tier]
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json({ error: 'Stripe is not configured. Contact support.' }, { status: 503 })
    }

    const profile = await db.user.findUnique({
      where: { id: user!.id },
      select: { stripeCustomerId: true, email: true },
    })

    let customerId = profile?.stripeCustomerId || undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user!.email ?? undefined,
        metadata: { userId: user!.id },
      })
      customerId = customer.id
      await db.user.update({ where: { id: user!.id }, data: { stripeCustomerId: customerId } })
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      metadata: { userId: user!.id, tier: tier as TierParam },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[POST /api/stripe/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
