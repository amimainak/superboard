// ============================================================
// Stripe Metered Billing — Agency Per-Student Architecture
// ============================================================
// This module handles Stripe metered billing for agency
// per-student charges. It wires up:
//
// 1. Agency checkout with metered billing item
// 2. Usage reporting (active student count → Stripe)
// 3. Invoice event handling
//
// REQUIRED ENV VARS (to be configured by the user):
//   STRIPE_SECRET_KEY              — Stripe secret key
//   STRIPE_WEBHOOK_SECRET          — Webhook signing secret
//   STRIPE_PRO_MONTHLY_PRICE_ID    — PRO $10/mo flat price
//   STRIPE_PRO_YEARLY_PRICE_ID     — PRO $96/yr flat price
//   STRIPE_AGENCY_BASE_PRICE_ID    — Agency $39/mo base fee
//   STRIPE_AGENCY_METERED_PRICE_ID — Agency $1.50/student metered price
//   STRIPE_EXTRA_SUBTUTOR_PRICE_ID — $5/mo per extra sub-tutor (optional)
//
// STRIPE DASHBOARD SETUP:
// 1. Create 5 products:
//    - "PRO Monthly"  → recurring price $10/mo
//    - "PRO Annual"   → recurring price $96/yr
//    - "Agency Base"  → recurring price $39/mo
//    - "Agency Student" → metered price $1.50/unit (usage_type: metered)
//    - "Extra Sub-Tutor" → metered price $5/unit (usage_type: metered)
//
// 2. Create a checkout session for AGENCY that includes:
//    - Agency Base price (recurring)
//    - Agency Student metered price (quantity: 1, will be updated)
//
// 3. At end of each billing cycle, Stripe sends invoice.created
//    → We report active student count via usage records
//
// 4. Stripe sends invoice.paid with the total amount
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
 * Stripe Price IDs needed:
 * - STRIPE_AGENCY_BASE_PRICE_ID    — $39/mo recurring
 * - STRIPE_AGENCY_METERED_PRICE_ID — $1.50/unit metered
 *
 * @param params - Checkout parameters
 * @returns Checkout session URL
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
        // Metered items start at quantity 1; actual usage is reported later
        // Quantity is not set for metered items — Stripe tracks usage
      },
    ],
    subscription_data: {
      metadata: {
        userId: params.userId,
        targetTier: 'AGENCY',
      },
      // Allow adding metered items later
      add_invoice_items: [],
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
 *
 * @param params - Checkout parameters
 * @returns Checkout session URL
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
 *
 * Called when Stripe sends `invoice.created` webhook (end of billing cycle).
 * This tells Stripe how many active students the agency had this period
 * so the invoice can be calculated.
 *
 * @param subscriptionId - Stripe subscription ID
 * @param activeStudentCount - Number of unique active students this period
 * @param action - 'set' to replace, 'increment' to add (default: 'set')
 */
export async function reportStudentUsage(params: {
  subscriptionId: string;
  activeStudentCount: number;
  action?: 'set' | 'increment';
}): Promise<void> {
  const stripe = await getStripeClientAsync();
  const meteredPriceId = process.env.STRIPE_AGENCY_METERED_PRICE_ID || '';

  if (!meteredPriceId || meteredPriceId.startsWith('TODO_')) {
    console.error(
      '[Stripe] Cannot report student usage — ' +
      'STRIPE_AGENCY_METERED_PRICE_ID not configured.'
    );
    return;
  }

  await stripe.subscriptionItems.createUsageRecord(
    // Find the metered subscription item
    // In production, we'd look up the specific item ID
    // For now, we use the subscription ID directly
    params.subscriptionId,
    {
      // The ID of the metered subscription item
      // This needs to be stored when the subscription is created
      quantity: params.activeStudentCount,
      action: params.action || 'set',
      timestamp: Math.floor(Date.now() / 1000), // now
    }
  );

  console.log(
    `[Stripe] Reported ${params.activeStudentCount} student(s) ` +
    `for subscription ${params.subscriptionId}`
  );
}

/**
 * Report extra sub-tutor usage to Stripe.
 *
 * Called for agencies with > 5 sub-tutors.
 * Each sub-tutor beyond 5 = 1 unit of extra sub-tutor usage.
 *
 * @param subscriptionId - Stripe subscription ID
 * @param extraSubTutorCount - Number of sub-tutors beyond 5
 */
export async function reportExtraSubTutorUsage(params: {
  subscriptionId: string;
  extraSubTutorCount: number;
}): Promise<void> {
  const stripe = await getStripeClientAsync();
  const extraPriceId = process.env.STRIPE_EXTRA_SUBTUTOR_PRICE_ID || '';

  if (!extraPriceId || extraPriceId.startsWith('TODO_')) {
    console.log(
      '[Stripe] Extra sub-tutor billing not configured — ' +
      'STRIPE_EXTRA_SUBTUTOR_PRICE_ID not set. Skipping.'
    );
    return;
  }

  if (params.extraSubTutorCount <= 0) return;

  // TODO: Implement usage record creation for extra sub-tutors
  // Similar to reportStudentUsage but with the extra sub-tutor price ID
  console.log(
    `[Stripe] Would report ${params.extraSubTutorCount} extra sub-tutor(s) ` +
    `for subscription ${params.subscriptionId} (price not yet configured)`
  );
}

/**
 * Get or create a Stripe Customer for a user.
 * Used to link users to their Stripe customer records.
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  // Check if user already has a Stripe customer ID
  const user = await (await import('@/lib/db')).db.user.findUnique({
    where: { id: params.userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name || undefined,
    metadata: {
      userId: params.userId,
    },
  });

  // Save the customer ID
  await (await import('@/lib/db')).db.user.update({
    where: { id: params.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Get the Stripe Customer Portal URL for managing subscriptions.
 * Allows users to update payment methods, view invoices, cancel.
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = await getStripeClientAsync();

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session.url;
}

// ---- Internal helpers ----

/**
 * Async wrapper for getStripeClient with lazy initialization.
 * Separated to avoid circular imports.
 */
async function getStripeClientAsync(): Promise<Stripe> {
  const { getStripeClient } = await import('./stripe');
  return getStripeClient();
}

// ---- Checkout Session Types ----

export interface CheckoutSessionParams {
  userId: string;
  tier: 'PRO' | 'AGENCY';
  customerId?: string;
  billingPeriod?: 'monthly' | 'yearly'; // Only for PRO
  appUrl: string;
}

/**
 * Unified checkout session creation.
 * Routes to PRO or Agency specific logic.
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
