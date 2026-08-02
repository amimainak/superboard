// ============================================================
// API Route: Stripe Webhook
// ============================================================
// Handles Pro/Agency subscription upgrades, downgrades, and cancellations.
// Verifies webhook signature, updates user tier in DB.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { db } from '@/lib/db';
import type { Tier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook authenticity
    let event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const targetTier = session.metadata?.targetTier as Tier | undefined;

        if (userId && targetTier) {
          await db.user.update({
            where: { id: userId },
            data: {
              tier: targetTier,
              stripeCustomerId: session.customer as string,
            },
          });
          console.log(`[Stripe] User ${userId} upgraded to ${targetTier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const targetTier = subscription.metadata?.targetTier as Tier | undefined;

        if (userId && targetTier) {
          // Update tier based on subscription status
          const newStatus = subscription.status;
          if (newStatus === 'active') {
            await db.user.update({
              where: { id: userId },
              data: { tier: targetTier },
            });
          } else if (newStatus === 'canceled' || newStatus === 'past_due') {
            await db.user.update({
              where: { id: userId },
              data: { tier: 'FREE' },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Downgrade to FREE
          await db.user.update({
            where: { id: userId },
            data: { tier: 'FREE' },
          });
          console.log(`[Stripe] User ${userId} downgraded to FREE`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
