import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data.object as any

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = data.metadata?.userId
        const tier = data.metadata?.tier
        const customerId = data.customer

        if (!userId || !tier) {
          console.warn('[Webhook] checkout.session.completed missing userId or tier in metadata')
          break
        }

        console.warn(`[Webhook] Upgrading user ${userId} to ${tier}`)

        const supabase = await createClient()
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

        const supabase = await createClient()
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
        // TODO: Send email notification, mark account, etc.
        break
      }

      default:
        // Unhandled event type — acknowledge anyway
        console.warn(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('[Webhook] Unhandled error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
