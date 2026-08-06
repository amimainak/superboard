// ============================================================
// Stripe Payment Utilities
// ============================================================
// Handles Stripe Checkout session creation and webhook processing.
// Secrets are accessed via env vars ONLY — never exported.
// ============================================================

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY || '';
    if (!apiKey || apiKey === 'TODO_STRIPE_SECRET_KEY') {
      throw new Error('Stripe secret key not configured');
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2026-07-29.dahlia',
    });
  }
  return stripeClient;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret || secret.startsWith('TODO_')) {
    throw new Error('Stripe webhook secret not configured');
  }
  return secret;
}

/**
 * Create a Stripe Checkout Session for tier upgrade.
 *
 * @param userId - The user's ID in our database
 * @param customerId - Stripe Customer ID (if existing)
 * @param tier - Target tier: PRO or AGENCY
 * @param billingPeriod - 'monthly' or 'yearly' (yearly only for PRO)
 * @returns Stripe Checkout Session URL
 */
export async function createCheckoutSession(params: {
  userId: string;
  customerId?: string;
  tier: 'PRO' | 'AGENCY';
  billingPeriod: 'monthly' | 'yearly';
  appUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();

  let priceId: string;
  if (params.tier === 'PRO') {
    priceId =
      params.billingPeriod === 'yearly'
        ? (process.env.STRIPE_PRO_YEARLY_PRICE_ID || '')
        : (process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '');
  } else {
    priceId = process.env.STRIPE_AGENCY_PRICE_ID || '';
  }

  if (!priceId || priceId.startsWith('TODO_')) {
    throw new Error(`Stripe price ID not configured for ${params.tier} ${params.billingPeriod}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId || undefined,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${params.appUrl}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.appUrl}/dashboard?upgrade=cancelled`,
    metadata: {
      userId: params.userId,
      targetTier: params.tier,
      billingPeriod: params.billingPeriod,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: params.tier,
      },
    } as any,
  });

  return session.url || '';
}

/**
 * Verify a Stripe webhook signature.
 * Used in /api/stripe/webhook to verify event authenticity.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
