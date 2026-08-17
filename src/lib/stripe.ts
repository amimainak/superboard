import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-07-29.dahlia',
})

/** Map tier names to their Stripe price ID env var keys */
export const TIER_PRICE_MAP: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID!,
}
