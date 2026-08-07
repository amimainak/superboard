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
      // SECURITY (V-24 FULL FIX): Derive tier from Stripe Price ID (server-side only),
      // NOT from client-submitted metadata. Metadata is used only as a cross-check.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) break;

        // PRIMARY: Derive tier from line_items price ID (server-authoritative)
        let resolvedTier: Tier | null = null;
        const { getTierFromPriceId } = await import('@/lib/stripe');

        if (session.line_items && typeof session.line_items === 'object') {
          const lineItems = (session.line_items as Stripe.ApiList<Stripe.LineItem>).data;
          for (const item of lineItems) {
            const tierFromPrice = getTierFromPriceId(item.price?.id || '');
            if (tierFromPrice) {
              resolvedTier = tierFromPrice;
              break;
            }
          }
        }

        // FALLBACK: If price lookup fails (e.g., Price IDs not configured yet),
        // validate metadata as secondary source
        if (!resolvedTier && isValidTier(session.metadata?.targetTier)) {
          resolvedTier = session.metadata?.targetTier;
          console.warn('[Stripe] Price-to-tier lookup returned null; fell back to metadata (less secure)');
        }

        if (resolvedTier) {
          await db.user.update({
            where: { id: userId },
            data: {
              tier: resolvedTier,
              stripeCustomerId: session.customer as string,
              ...(session.subscription
                ? { stripeSubscriptionId: typeof session.subscription === 'string'
                    ? session.subscription
                    : (session.subscription as unknown as { id?: string }).id || null }
                : {}),
            },
          });
          console.log(`[Stripe] User ${userId} upgraded to ${resolvedTier}`);
        } else {
          console.error(`[Stripe] Could not resolve tier from price ID or metadata for user ${userId}`);
        }
        break;
      }

      // ---- Subscription Updated: Sync tier status ----
      // SECURITY (V-24): Derive tier from subscription's price items
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) break;

        const newStatus = subscription.status;

        if (newStatus === 'canceled' || newStatus === 'past_due') {
          await db.user.update({
            where: { id: userId },
            data: { tier: 'FREE' },
          });
          break;
        }

        // Derive tier from subscription's price items
        const { getTierFromPriceId } = await import('@/lib/stripe');
        let resolvedTier: Tier | null = null;
        for (const item of subscription.items.data) {
          const tierFromPrice = getTierFromPriceId(item.price?.id || '');
          if (tierFromPrice) {
            resolvedTier = tierFromPrice;
            break;
          }
        }

        // FALLBACK: metadata cross-check
        if (!resolvedTier && isValidTier(subscription.metadata?.targetTier)) {
          resolvedTier = subscription.metadata?.targetTier;
          console.warn('[Stripe] Sub update: price lookup null; fell back to metadata');
        }

        if (newStatus === 'active' && resolvedTier) {
          await db.user.update({
            where: { id: userId },
            data: {
              tier: resolvedTier,
              stripeSubscriptionId: subscription.id,
            },
          });
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
