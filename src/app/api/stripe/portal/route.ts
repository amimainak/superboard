import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('User')
      .select('stripeCustomerId')
      .eq('id', user!.id)
      .single()

    if (!profile?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe to a plan first.' },
        { status: 400 },
      )
    }

    const portalConfigId = process.env.STRIPE_PORTAL_CONFIG_ID
    if (!portalConfigId || portalConfigId.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Customer portal is not configured yet.' },
        { status: 503 },
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
      configuration: portalConfigId,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[POST /api/stripe/portal]', err)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    )
  }
}
