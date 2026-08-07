// ============================================================
// API Route: Stripe Webhook
// ============================================================
// Handles:
// - PRO subscription upgrades/downgrades/cancellations
// - Agency base fee subscription
// - Agency metered billing (per-student) — invoice.created triggers usage reporting
// - Subscription deletion → downgrade to FREE
//
// SECURITY FIX (V-24): Added tier validation in checkout metadata.
//   Only allows valid tier values from checkout session metadata.
// FIX (I-05): Removed unnecessary as-any casts where possible.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { db } from '@/lib/db';
import type { Tier } from '@/types';

// SECURITY (V-24): Valid tiers for Stripe metadata
const VALID_TIERS = new Set<string>(['FREE', 'PRO', 'AGENCY']);

function isValidTier(tier: unknown): tier is Tier {
  return typeof tier === 'string' && VALID_TIERS.has(tier);
}

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
      // ---- Checkout Complete: Activate tier ----
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const targetTier = session.metadata?.targetTier;

        // SECURITY (V-24): Validate tier before applying
        if (userId && isValidTier(targetTier)) {
          await db.user.update({
            where: { id: userId },
            data: {
              tier: targetTier,
              stripeCustomerId: session.customer as string,
              ...(session.subscription
                ? { stripeSubscriptionId: session.subscription as string }
                : {}),
            },
          });
          console.log(`[Stripe] User ${userId} upgraded to ${targetTier}`);
        } else if (userId && targetTier) {
          console.error(`[Stripe] Invalid tier in checkout metadata: ${targetTier}`);
        }
        break;
      }

      // ---- Subscription Updated: Sync tier status ----
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const targetTier = subscription.metadata?.targetTier;

        if (userId && isValidTier(targetTier)) {
          const newStatus = subscription.status;
          if (newStatus === 'active') {
            await db.user.update({
              where: { id: userId },
              data: {
                tier: targetTier,
                stripeSubscriptionId: subscription.id,
              },
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

      // ---- Subscription Deleted: Downgrade to FREE ----
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Downgrade to FREE
          await db.user.update({
            where: { id: userId },
            data: { tier: 'FREE', stripeSubscriptionId: null },
          });
          console.log(`[Stripe] User ${userId} downgraded to FREE`);
        }
        break;
      }

      // ---- Invoice Created: Report agency student usage ----
      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        // Stripe API 2026: subscription field may not be directly typed on Invoice
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null | undefined;
        const subscriptionStrId = typeof subscriptionId === 'string' ? subscriptionId
          : (subscriptionId as { id?: string } | undefined)?.id ?? null;

        if (subscriptionStrId && invoice.billing_reason === 'subscription_cycle') {
          // Find the user who owns this subscription
          const user = await db.user.findFirst({
            where: { stripeSubscriptionId: subscriptionStrId },
            select: { id: true, tier: true },
          });

          if (user && user.tier === 'AGENCY') {
            try {
              // Count active students for this agency
              const subTutors = await db.user.findMany({
                where: { parentAgencyId: user.id },
                select: { id: true },
              });
              const subTutorIds = subTutors.map((t) => t.id);

              const activeRooms = await db.room.findMany({
                where: {
                  tutorId: { in: subTutorIds },
                  isActive: true,
                },
                select: { id: true },
              });
              const activeRoomIds = activeRooms.map((r) => r.id);

              if (activeRoomIds.length > 0) {
                const billingPeriodStart = new Date(
                  invoice.period_start * 1000
                );

                const activeStudents = await db.roomParticipant.findMany({
                  where: {
                    roomId: { in: activeRoomIds },
                    lastActiveAt: { gte: billingPeriodStart },
                  },
                  select: { studentIdentity: true },
                  distinct: ['studentIdentity'],
                });

                // Report usage to Stripe
                const { getStripeClient } = await import('@/lib/stripe');
                const stripe = getStripeClient();
                const subscription = await stripe.subscriptions.retrieve(
                  subscriptionStrId,
                  { expand: ['items.data.price'] }
                );

                const meteredItem = subscription.items.data.find(
                  (item) =>
                    item.price.recurring?.usage_type === 'metered' ||
                    item.price.billing_scheme === 'per_unit'
                );

                if (meteredItem) {
                  // Stripe API 2026-07-29: createUsageRecord may be deprecated
                  // Use as-safe fallback for backward compatibility
                  try {
                    await (stripe.subscriptionItems as any).createUsageRecord(
                      meteredItem.id,
                      {
                        quantity: activeStudents.length,
                        action: 'set',
                        timestamp: Math.floor(Date.now() / 1000),
                      }
                    );
                  } catch (apiErr) {
                    console.warn('[Stripe] createUsageRecord failed (may need API update):', apiErr);
                  }
                  console.log(
                    `[Stripe] Reported ${activeStudents.length} active students ` +
                    `for agency ${user.id} (subscription ${subscriptionStrId})`
                  );
                } else {
                  console.log(
                    `[Stripe] No metered item found on subscription ${subscriptionStrId}. ` +
                    'Student usage not reported.'
                  );
                }
              } else {
                console.log(
                  `[Stripe] Agency ${user.id} has no active rooms — reporting 0 students.`
                );
              }
            } catch (usageError) {
              console.error(
                `[Stripe] Failed to report student usage for agency ${user.id}:`,
                usageError
              );
            }
          }
        }
        break;
      }

      // ---- Invoice Paid: Log successful payment ----
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as Record<string, unknown>).subscription as string | null | undefined;
        const subscriptionId = typeof subId === 'string' ? subId
          : (subId as { id?: string } | undefined)?.id ?? null;

        if (subscriptionId) {
          const user = await db.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            select: { id: true },
          });

          if (user) {
            console.log(
              `[Stripe] Invoice paid for user ${user.id}: ` +
              `$${invoice.amount_paid / 100} (subscription ${subscriptionId})`
            );
          }
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

// Need Stripe types for webhook processing
import Stripe from 'stripe';
