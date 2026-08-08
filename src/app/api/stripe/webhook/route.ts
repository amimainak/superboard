// ============================================================
// API Route: Stripe Webhook
// ============================================================
// Handles:
// - PRO subscription upgrades/downgrades/cancellations
// - Agency Standard/Premium base fee + metered hourly billing
// - Subscription deletion → downgrade to FREE
//
// SECURITY FIX (V-24): Added tier validation in checkout metadata.
//   Only allows valid tier values from checkout session metadata.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { db } from '@/lib/db';
import type { Tier } from '@/types';
import { isAgencyTier } from '@/types';
import { logAudit } from '@/lib/audit';

// Valid tiers for Stripe metadata (includes new agency tiers)
const VALID_TIERS = new Set<string>([
  'FREE', 'PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM',
]);

function isValidTier(tier: unknown): tier is Tier {
  return typeof tier === 'string' && VALID_TIERS.has(tier);
}

/**
 * Resolve the canonical tier from a potentially legacy tier value.
 * AGENCY → AGENCY_STANDARD (migration path)
 */
function resolveTier(tier: Tier): Tier {
  if (tier === 'AGENCY') return 'AGENCY_STANDARD';
  return tier;
}

/**
 * Get the plan name and monthly amount for a given tier.
 */
function getPlanInfo(tier: Tier): { planName: string; amountMonthlyCents: number } {
  switch (tier) {
    case 'AGENCY_STANDARD':
      return { planName: 'Agency Standard', amountMonthlyCents: 3900 };
    case 'AGENCY_PREMIUM':
      return { planName: 'Agency Premium', amountMonthlyCents: 7900 };
    case 'PRO':
      return { planName: 'Pro Tutor', amountMonthlyCents: 1000 };
    default:
      return { planName: 'Unknown', amountMonthlyCents: 0 };
  }
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

        // FALLBACK: If price lookup fails, validate metadata as secondary source
        if (!resolvedTier && isValidTier(session.metadata?.targetTier)) {
          resolvedTier = session.metadata?.targetTier;
          console.warn('[Stripe] Price-to-tier lookup returned null; fell back to metadata');
        }

        if (resolvedTier) {
          resolvedTier = resolveTier(resolvedTier);

          const updatedUser = await db.user.update({
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

          // Sync Subscription table
          try {
            const subId = typeof session.subscription === 'string'
              ? session.subscription
              : (session.subscription as unknown as { id?: string }).id || null;
            if (subId) {
              const planInfo = getPlanInfo(resolvedTier);
              await db.subscription.upsert({
                where: { stripeSubscriptionId: subId },
                update: { status: 'active', userId: updatedUser.id, planName: planInfo.planName },
                create: {
                  userId: updatedUser.id,
                  stripeSubscriptionId: subId,
                  planName: planInfo.planName,
                  status: 'active',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  amountMonthlyCents: planInfo.amountMonthlyCents,
                },
              });
            }
          } catch (subErr) {
            console.warn('[Stripe] Subscription table sync failed:', subErr);
          }
        } else {
          console.error(`[Stripe] Could not resolve tier for user ${userId}`);
        }
        break;
      }

      // ---- Subscription Updated: Sync tier status ----
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
          // Sync subscription status
          try {
            await db.subscription.upsert({
              where: { stripeSubscriptionId: subscription.id },
              update: { status: newStatus },
              create: {
                userId,
                stripeSubscriptionId: subscription.id,
                planName: 'Unknown',
                status: newStatus,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                amountMonthlyCents: 0,
              },
            });
          } catch (subErr) {
            console.warn('[Stripe] Subscription table sync failed:', subErr);
          }
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
          resolvedTier = resolveTier(resolvedTier);

          await db.user.update({
            where: { id: userId },
            data: {
              tier: resolvedTier,
              stripeSubscriptionId: subscription.id,
            },
          });
          // Sync subscription table
          try {
            const planInfo = getPlanInfo(resolvedTier);
            await db.subscription.upsert({
              where: { stripeSubscriptionId: subscription.id },
              update: {
                status: 'active',
                planName: planInfo.planName,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
              },
              create: {
                userId,
                stripeSubscriptionId: subscription.id,
                planName: planInfo.planName,
                status: 'active',
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
                amountMonthlyCents: planInfo.amountMonthlyCents,
              },
            });
          } catch (subErr) {
            console.warn('[Stripe] Subscription table sync failed on update:', subErr);
          }
        }
        break;
      }

      // ---- Subscription Deleted: Downgrade to FREE ----
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: { tier: 'FREE', stripeSubscriptionId: null },
          });
          try {
            await db.subscription.updateMany({
              where: { stripeSubscriptionId: subscription.id },
              data: { status: 'canceled' },
            });
          } catch (subErr) {
            console.warn('[Stripe] Subscription table update on delete:', subErr);
          }
          console.log(`[Stripe] User ${userId} downgraded to FREE`);
        }
        break;
      }

      // ---- Invoice Created: Report agency hourly usage ----
      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null | undefined;
        const subscriptionStrId = typeof subscriptionId === 'string' ? subscriptionId
          : (subscriptionId as { id?: string } | undefined)?.id ?? null;

        if (subscriptionStrId && invoice.billing_reason === 'subscription_cycle') {
          // Find the user who owns this subscription
          const user = await db.user.findFirst({
            where: { stripeSubscriptionId: subscriptionStrId },
            select: { id: true, tier: true },
          });

          if (user && isAgencyTier(user.tier)) {
            try {
              const billingPeriodStart = new Date(invoice.period_start * 1000);

              const { reportHourlyUsage } = await import('@/lib/stripe-billing');
              await reportHourlyUsage({
                subscriptionId: subscriptionStrId,
                billingPeriodStart,
              });

              console.log(
                `[Stripe] Hourly usage reported for agency ${user.id} ` +
                `(subscription ${subscriptionStrId})`
              );
            } catch (usageError) {
              console.error(
                `[Stripe] Failed to report hourly usage for agency ${user.id}:`,
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
