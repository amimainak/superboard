// ============================================================
// API Route: Stripe Checkout (Unified)
// ============================================================
// GET: Creates a Stripe checkout session and redirects to it.
//      Supported plans: pro, pro-yearly, agency-standard, agency-premium
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe-billing';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan');

    if (!plan) {
      return NextResponse.json(
        { error: 'Missing plan parameter' },
        { status: 400 }
      );
    }

    // Map plan param to tier
    let tier: 'PRO' | 'AGENCY_STANDARD' | 'AGENCY_PREMIUM';
    let billingPeriod: 'monthly' | 'yearly' = 'monthly';

    switch (plan) {
      case 'pro':
        tier = 'PRO';
        billingPeriod = 'monthly';
        break;
      case 'pro-yearly':
        tier = 'PRO';
        billingPeriod = 'yearly';
        break;
      case 'agency-standard':
        tier = 'AGENCY_STANDARD';
        break;
      case 'agency-premium':
        tier = 'AGENCY_PREMIUM';
        break;
      default:
        return NextResponse.json(
          { error: `Unknown plan: ${plan}. Use pro, pro-yearly, agency-standard, or agency-premium` },
          { status: 400 }
        );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer({
      userId: auth.userId,
      email: auth.email || '',
    });

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutUrl = await createCheckoutSession({
      userId: auth.userId,
      tier,
      customerId,
      billingPeriod,
      appUrl,
    });

    // Redirect to Stripe Checkout
    return NextResponse.redirect(checkoutUrl);
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Unable to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
