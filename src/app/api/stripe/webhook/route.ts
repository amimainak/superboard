import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { db } from '@/lib/db'

const VALID_WEBHOOK_TIERS = ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'] as const

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    if (!sig) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Webhook] Signature verification failed: ${message}`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data.object as any

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = data.metadata?.userId
        const tier = data.metadata?.tier
        const customerId = data.customer
        if (!userId || !tier) break
        if (!VALID_WEBHOOK_TIERS.includes(tier as typeof VALID_WEBHOOK_TIERS[number])) break

        console.warn(`[Webhook] Upgrading user ${userId} to ${tier}`)
        await db.user.update({
          where: { id: userId },
          data: { tier, stripeCustomerId: customerId, updatedAt: new Date() },
        }).catch(e => console.error(`[Webhook] Failed to update user ${userId}:`, e))
        break
      }
      case 'customer.subscription.deleted': {
        const customerId = data.customer
        if (!customerId) break
        console.warn(`[Webhook] Subscription deleted for customer ${customerId}, reverting to FREE`)
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { tier: 'FREE', updatedAt: new Date() },
        }).catch(e => console.error(`[Webhook] Failed to revert tier:`, e))
        break
      }
      case 'invoice.payment_failed': {
        console.warn(`[Webhook] Payment failed for customer ${data.customer}`)
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
