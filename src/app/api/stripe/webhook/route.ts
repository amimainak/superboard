import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const VALID_WEBHOOK_TIERS = ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'] as const;

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Webhook] Signature verification failed: ${message}`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const data = event.data.object as any

    // SECURITY FIX (AUDIT-MED-3): Use service role client for webhook operations.
    // The anon client relies on RLS, but the Stripe webhook is a server-to-server
    // call with no user session — it needs to bypass RLS.
    const supabase = createServerClient()
    if (!supabase) {
      console.error('[Webhook] Supabase server client not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = data.metadata?.userId
        const tier = data.metadata?.tier
        const customerId = data.customer

        if (!userId || !tier) {
          console.warn('[Webhook] checkout.session.completed missing userId or tier in metadata')
          break
        }

        // Validate tier against known values to prevent arbitrary strings
        if (!VALID_WEBHOOK_TIERS.includes(tier as any)) {
          console.error(`[Webhook] Invalid tier '${tier}' in checkout metadata for user ${userId}`)
          break
        }

        console.warn(`[Webhook] Upgrading user ${userId} to ${tier}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('User')
          .update({
            tier,
            stripeCustomerId: customerId,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error(`[Webhook] Failed to update user ${userId}:`, error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const customerId = data.customer
        if (!customerId) {
          console.warn('[Webhook] customer.subscription.deleted missing customer ID')
          break
        }

        console.warn(`[Webhook] Subscription deleted for customer ${customerId}, reverting to FREE`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('User')
          .update({
            tier: 'FREE',
            updatedAt: new Date().toISOString(),
          })
          .eq('stripeCustomerId', customerId)

        if (error) {
          console.error(`[Webhook] Failed to revert tier for customer ${customerId}:`, error)
        }
        break
      }

      case 'invoice.payment_failed': {
        const customerId = data.customer
        console.warn(`[Webhook] Payment failed for customer ${customerId}. Consider notifying user.`)
        break
      }

      default:
        console.warn(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('[Webhook] Unhandled error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
