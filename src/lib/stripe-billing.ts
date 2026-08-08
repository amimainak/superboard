// ============================================================
// Stripe Metered Billing — Agency Hourly Architecture
// ============================================================
// Agency Standard: $39/mo base + $3.00/hr metered
// Agency Premium:  $79/mo base + $2.00/hr metered
//
// Replaces the previous per-student billing model.
// Uses subscription ITEM ID for createUsageRecord calls.
// ============================================================

import Stripe from 'stripe';

// ---- Re-export existing helpers ----
export { getStripeClient, getWebhookSecret, verifyWebhookSignature } from './stripe';

/**
 * Create a Stripe Checkout Session for Agency Standard tier.
 * Includes:
 * - Base fee ($39/mo) as recurring line item
 * - Metered per-hour billing ($3.00/hr)
 */
export async function createAgencyStandardCheckoutSession(params: {
  userId: string;
  customerId?: string;
  appUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const basePriceId = process.env.STRIPE_AGENCY_STD_BASE_PRICE_ID || '';
  const hourlyPriceId = process.env.STRIPE_AGENCY_STD_HOURLY_PRICE_ID || '';

  if (!basePriceId || basePriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_STD_BASE_PRICE_ID not configured. ' +
      'Create a $39/mo recurring price in Stripe Dashboard first.'
    );
  }

  if (!hourlyPriceId || hourlyPriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_STD_HOURLY_PRICE_ID not configured. ' +
      'Create a $3.00/hr metered price in Stripe Dashboard first.'
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId || undefined,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      { price: basePriceId, quantity: 1 },
      { price: hourlyPriceId },
    ],
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: 'AGENCY_STANDARD',
      },
    },
    success_url: `${params.appUrl}/dashboard?upgrade=success`,
    cancel_url: `${params.appUrl}/dashboard?upgrade=cancelled`,
    metadata: {
      userId: params.userId,
      targetTier: 'AGENCY_STANDARD',
    },
  });

  return session.url || '';
}

/**
 * Create a Stripe Checkout Session for Agency Premium tier.
 * Includes:
 * - Base fee ($79/mo) as recurring line item
 * - Metered per-hour billing ($2.00/hr)
 */
export async function createAgencyPremiumCheckoutSession(params: {
  userId: string;
  customerId?: string;
  appUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const basePriceId = process.env.STRIPE_AGENCY_PREM_BASE_PRICE_ID || '';
  const hourlyPriceId = process.env.STRIPE_AGENCY_PREM_HOURLY_PRICE_ID || '';

  if (!basePriceId || basePriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_PREM_BASE_PRICE_ID not configured. ' +
      'Create a $79/mo recurring price in Stripe Dashboard first.'
    );
  }

  if (!hourlyPriceId || hourlyPriceId.startsWith('TODO_')) {
    throw new Error(
      'STRIPE_AGENCY_PREM_HOURLY_PRICE_ID not configured. ' +
      'Create a $2.00/hr metered price in Stripe Dashboard first.'
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId || undefined,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      { price: basePriceId, quantity: 1 },
      { price: hourlyPriceId },
    ],
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: 'AGENCY_PREMIUM',
      },
    },
    success_url: `${params.appUrl}/dashboard?upgrade=success`,
    cancel_url: `${params.appUrl}/dashboard?upgrade=cancelled`,
    metadata: {
      userId: params.userId,
      targetTier: 'AGENCY_PREMIUM',
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
    success_url: `${params.appUrl}/dashboard?upgrade=success`,
    cancel_url: `${params.appUrl}/dashboard?upgrade=cancelled`,
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
 * Report lesson hour usage to Stripe for metered billing.
 * Queries completed rooms (endedAt is not null) within the billing period,
 * sums durationMinutes, converts to hours, and reports to Stripe.
 *
 * @param subscriptionId - Stripe subscription ID
 * @param billingPeriodStart - Start of the current billing period
 */
export async function reportHourlyUsage(params: {
  subscriptionId: string;
  billingPeriodStart: Date;
}): Promise<void> {
  const stripe = await getStripeClientAsync();

  // Retrieve the subscription with its items
  const subscription = await stripe.subscriptions.retrieve(
    params.subscriptionId,
    { expand: ['items.data.price'] }
  );

  // Find the metered (hourly) line item
  const meteredItem = subscription.items.data.find(
    (item) =>
      item.price.recurring?.usage_type === 'metered' ||
      item.price.billing_scheme === 'per_unit'
  );

  if (!meteredItem) {
    console.log(
      `[Stripe] No metered item found on subscription ${params.subscriptionId}. ` +
      'Hourly usage not reported.'
    );
    return;
  }

  // Query the database for total lesson hours in the billing period
  const { db } = await import('@/lib/db');

  // Find the user who owns this subscription
  const user = await db.user.findFirst({
    where: { stripeSubscriptionId: params.subscriptionId },
    select: { id: true },
  });

  if (!user) {
    console.error(`[Stripe] No user found for subscription ${params.subscriptionId}`);
    return;
  }

  // Get all sub-tutor IDs under this agency
  const subTutors = await db.user.findMany({
    where: { parentAgencyId: user.id },
    select: { id: true },
  });
  const subTutorIds = subTutors.map((t) => t.id);

  // Also include the agency owner's own rooms
  const allTutorIds = [...subTutorIds, user.id];

  // Sum durationMinutes for completed rooms in the billing period
  const rooms = await db.room.findMany({
    where: {
      tutorId: { in: allTutorIds },
      endedAt: { gte: params.billingPeriodStart },
    },
    select: { durationMinutes: true },
  });

  const totalMinutes = rooms.reduce((sum, r) => sum + r.durationMinutes, 0);
  // Convert to hours, round up to nearest hour (minimum 0)
  const totalHours = Math.ceil(totalMinutes / 60);

  if (totalHours <= 0) return;

  // Report to Stripe
  try {
    await (stripe.subscriptionItems as any).createUsageRecord(
      meteredItem.id,
      {
        quantity: totalHours,
        action: 'set',
        timestamp: Math.floor(Date.now() / 1000),
      }
    );
    console.log(
      `[Stripe] Reported ${totalHours} lesson hours (${totalMinutes} minutes) ` +
      `for subscription ${params.subscriptionId}`
    );
  } catch (apiErr) {
    console.warn('[Stripe] createUsageRecord failed (may need API update):', apiErr);
  }
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

export type AgencyPlan = 'agency-standard' | 'agency-premium';

export interface CheckoutSessionParams {
  userId: string;
  tier: 'PRO' | 'AGENCY_STANDARD' | 'AGENCY_PREMIUM';
  customerId?: string;
  billingPeriod?: 'monthly' | 'yearly';
  appUrl: string;
}

/**
 * Unified checkout session creation.
 * Routes to the correct function based on tier.
 */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<string> {
  if (params.tier === 'AGENCY_STANDARD') {
    return createAgencyStandardCheckoutSession({
      userId: params.userId,
      customerId: params.customerId,
      appUrl: params.appUrl,
    });
  }

  if (params.tier === 'AGENCY_PREMIUM') {
    return createAgencyPremiumCheckoutSession({
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
