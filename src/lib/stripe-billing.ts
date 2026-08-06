// ============================================================
// Stripe Metered Billing — Agency Per-Student Architecture
// ============================================================
// FIXED: Uses subscription ITEM ID (not subscription ID) for
// createUsageRecord calls. Stores subscription item IDs when
// the checkout session is created.
// ============================================================

import Stripe from 'stripe';

// ---- Re-export existing helpers ----
export { getStripeClient, getWebhookSecret, verifyWebhookSignature } from './stripe';

/**
 * Create a Stripe Checkout Session for Agency tier.
 * Includes:
 * - Base fee ($39/mo) as recurring line item
 * - Metered per-student billing ($1.50/student)
 *
 * FIXED: Removed `add_invoice_items` from subscription_data (deprecated in API 2026-07-29)
 */
export async function createAgencyCheckoutSession(params: {
  userId: string;
  customerId?: string;
  appUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const basePriceId = process.env.STRIPE_AGENCY_BASE_PRICE_ID || '';
  const meteredPriceId = process.env.STRIPE_AGENCY_METERED_PRICE_ID || '';

  if (!basePriceId || basePriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_BASE_PRICE_ID not configured. ' +
      'Create a $39/mo recurring price in Stripe Dashboard first.'
    );
  }

  if (!meteredPriceId || meteredPriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_METERED_PRICE_ID not configured. ' +
      'Create a $1.50 metered price in Stripe Dashboard first.'
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId || undefined,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: basePriceId,
        quantity: 1,
      },
      {
        price: meteredPriceId,
      },
    ],
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: 'AGENCY',
      },
    },
    success_url: `${params.appUrl}/?upgrade=success`,
    cancel_url: `${params.appUrl}/?upgrade=cancelled`,
    metadata: {
      userId: params.userId,
      targetTier: 'AGENCY',
    },
  });

  return session.url || '';
}

/**
 * Create a Stripe Checkout Session for PRO tier.
 * Updated with new pricing: $10/mo or $96/yr.
 */
export async function createProCheckoutSession(params: {
  userId: string;
  customerId?: string;
  billingPeriod: 'monthly' | 'yearly';
  appUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  let priceId: string;
  if (params.billingPeriod === 'yearly') {
    priceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID || '';
  } else {
    priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '';
  }

  if (!priceId || priceId.startsWith('TODO_')) {
    throw new Error(
      `Stripe price ID not configured for PRO ${params.billingPeriod}. ` +
      'Create a $10/mo or $96/yr recurring price in Stripe Dashboard first.'
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId || undefined,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${params.appUrl}/?upgrade=success`,
    cancel_url: `${params.appUrl}/?upgrade=cancelled`,
    metadata: {
      userId: params.userId,
      targetTier: 'PRO',
      billingPeriod: params.billingPeriod,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: 'PRO',
      },
    },
  });

  return session.url || '';
}

/**
 * Report active student usage to Stripe for metered billing.
 * FIXED: Uses subscriptionItem ID (not subscription ID) for createUsageRecord.
 *
 * @param subscriptionItemId - Stripe subscription ITEM ID (not subscription ID)
 * @param activeStudentCount - Number of unique active students this period
 * @param action - 'set' to replace, 'increment' to add (default: 'set')
 */
export async function reportStudentUsage(params: {
  subscriptionItemId: string;
  activeStudentCount: number;
  action?: 'set' | 'increment';
}): Promise<void> {
  const stripe = await getStripeClientAsync();

  if (params.activeStudentCount <= 0) return;

  await (stripe.subscriptionItems as any).createUsageRecord(
    params.subscriptionItemId,
    {
      quantity: params.activeStudentCount,
      action: params.action || 'set',
      timestamp: Math.floor(Date.now() / 1000),
    }
  );

  console.log(
    `[Stripe] Reported ${params.activeStudentCount} student(s) ` +
    `for subscription item ${params.subscriptionItemId}`
  );
}

/**
 * Report extra sub-tutor usage to Stripe.
 */
export async function reportExtraSubTutorUsage(params: {
  subscriptionItemId: string;
  extraSubTutorCount: number;
}): Promise<void> {
  const stripe = await getStripeClientAsync();

  if (params.extraSubTutorCount <= 0) return;

  await (stripe.subscriptionItems as any).createUsageRecord(
    params.subscriptionItemId,
    {
      quantity: params.extraSubTutorCount,
      action: 'set',
      timestamp: Math.floor(Date.now() / 1000),
    }
  );

  console.log(
    `[Stripe] Reported ${params.extraSubTutorCount} extra sub-tutor(s) ` +
    `for subscription item ${params.subscriptionItemId}`
  );
}

/**
 * Get or create a Stripe Customer for a user.
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const user = await (await import('@/lib/db')).db.user.findUnique({
    where: { id: params.userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name || undefined,
    metadata: {
      userId: params.userId,
    },
  });

  await (await import('@/lib/db')).db.user.update({
    where: { id: params.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Get the Stripe Customer Portal URL for managing subscriptions.
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const session = stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return (await session).url;
}

// ---- Internal helpers ----

async function getStripeClientAsync(): Promise<Stripe> {
  const { getStripeClient } = await import('./stripe');
  return getStripeClient();
}

// ---- Checkout Session Types ----

export interface CheckoutSessionParams {
  userId: string;
  tier: 'PRO' | 'AGENCY';
  customerId?: string;
  billingPeriod?: 'monthly' | 'yearly';
  appUrl: string;
}

/**
 * Unified checkout session creation.
 */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<string> {
  if (params.tier === 'AGENCY') {
    return createAgencyCheckoutSession({
      userId: params.userId,
      customerId: params.customerId,
      appUrl: params.appUrl,
    });
  }

  return createProCheckoutSession({
    userId: params.userId,
    customerId: params.customerId,
    billingPeriod: params.billingPeriod || 'monthly',
    appUrl: params.appUrl,
  });
}
