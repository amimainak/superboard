import Stripe from 'stripe'

let _stripe: Stripe | null = null

/** Lazy-initialised Stripe singleton — safe to import at build time. */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-07-29.dahlia',
    })
  }
  return _stripe
}

/** Backwards-compatible alias used by existing routes. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})

/** Map tier names to their Stripe price ID env var keys */
export const TIER_PRICE_MAP: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? '',
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? '',
}
