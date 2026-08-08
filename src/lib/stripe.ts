// ============================================================
// Stripe Payment Utilities
// ============================================================
// Handles Stripe Checkout session creation and webhook processing.
// Secrets are accessed via env vars ONLY — never exported.
// ============================================================

import Stripe from 'stripe';
import type { Tier } from '@/types';
import { isAgencyTier } from '@/types';

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

/**
 * SECURITY (V-24): Derive tier from Stripe Price ID.
 * This is the authoritative mapping — used by the webhook to determine
 * what tier a subscription corresponds to, WITHOUT trusting client-side metadata.
 *
 * Supports 4 agency price IDs:
 *   - STRIPE_AGENCY_STD_BASE_PRICE_ID    → AGENCY_STANDARD (base)
 *   - STRIPE_AGENCY_STD_HOURLY_PRICE_ID  → AGENCY_STANDARD (metered)
 *   - STRIPE_AGENCY_PREM_BASE_PRICE_ID   → AGENCY_PREMIUM (base)
 *   - STRIPE_AGENCY_PREM_HOURLY_PRICE_ID  → AGENCY_PREMIUM (metered)
 * Plus legacy:
 *   - STRIPE_AGENCY_PRICE_ID             → AGENCY (legacy)
 *   - STRIPE_AGENCY_BASE_PRICE_ID         → AGENCY (legacy)
 */
const PRICE_ID_TO_TIER: Record<string, Tier> = {};

function initPriceTierMap(): void {
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '';
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID || '';
  const agencyPrice = process.env.STRIPE_AGENCY_PRICE_ID || '';
  const agencyBasePrice = process.env.STRIPE_AGENCY_BASE_PRICE_ID || '';
  const agencyMeteredPrice = process.env.STRIPE_AGENCY_METERED_PRICE_ID || '';
  const agencyStdBase = process.env.STRIPE_AGENCY_STD_BASE_PRICE_ID || '';
  const agencyStdHourly = process.env.STRIPE_AGENCY_STD_HOURLY_PRICE_ID || '';
  const agencyPremBase = process.env.STRIPE_AGENCY_PREM_BASE_PRICE_ID || '';
  const agencyPremHourly = process.env.STRIPE_AGENCY_PREM_HOURLY_PRICE_ID || '';

  if (proMonthly && !proMonthly.startsWith('TODO_')) PRICE_ID_TO_TIER[proMonthly] = 'PRO';
  if (proYearly && !proYearly.startsWith('TODO_')) PRICE_ID_TO_TIER[proYearly] = 'PRO';

  // Legacy agency prices
  if (agencyPrice && !agencyPrice.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyPrice] = 'AGENCY';
  if (agencyBasePrice && !agencyBasePrice.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyBasePrice] = 'AGENCY';
  if (agencyMeteredPrice && !agencyMeteredPrice.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyMeteredPrice] = 'AGENCY';

  // New agency tier prices
  if (agencyStdBase && !agencyStdBase.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyStdBase] = 'AGENCY_STANDARD';
  if (agencyStdHourly && !agencyStdHourly.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyStdHourly] = 'AGENCY_STANDARD';
  if (agencyPremBase && !agencyPremBase.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyPremBase] = 'AGENCY_PREMIUM';
  if (agencyPremHourly && !agencyPremHourly.startsWith('TODO_')) PRICE_ID_TO_TIER[agencyPremHourly] = 'AGENCY_PREMIUM';
}

// Build the map once at module load time
initPriceTierMap();

/**
 * Look up the tier corresponding to a Stripe Price ID.
 * Returns null if the price ID is not recognized.
 */
export function getTierFromPriceId(priceId: string): Tier | null {
  return PRICE_ID_TO_TIER[priceId] || null;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret || secret.startsWith('TODO_')) {
    throw new Error('Stripe webhook secret not configured');
  }
  return secret;
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
