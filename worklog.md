---
Task ID: 1-8
Agent: Main Agent
Task: Implement agency tier overhaul — AGENCY_STANDARD/AGENCY_PREMIUM, student registration, hourly billing

Work Log:
- Phase 1: Updated prisma/schema.prisma — Added Student model, AGENCY_STANDARD/AGENCY_PREMIUM to Tier enum, Room.durationMinutes/endedAt fields, RoomParticipant.studentId FK
- Phase 2: Updated src/types/index.ts — Expanded Tier type, added isAgencyTier() helper, updated PRICING and TIER_LIMITS with new tiers, added StudentRow type
- Phase 3: Updated src/lib/stripe.ts — New price-to-tier mappings for 4 agency price IDs. Updated src/lib/stripe-billing.ts — New createAgencyStandardCheckoutSession(), createAgencyPremiumCheckoutSession(), reportHourlyUsage(). Removed legacy per-student billing.
- Phase 3: Rewrote src/app/api/stripe/webhook/route.ts — invoice.created now reports lesson hours instead of student counts. Added resolveTier() for AGENCY→AGENCY_STANDARD migration.
- Phase 4: Created 5 new API routes: student register, student update/delete, student import (CSV), room join (email-based), agency hours
- Phase 4: Updated src/app/api/agency/invite/route.ts — Enforces sub-tutor limit per tier (5 for Standard, unlimited for Premium)
- Phase 5: Updated BillingPanel — 3 upgrade cards (Pro, Agency Standard, Agency Premium), wired to actual Stripe checkout
- Phase 5: Updated DashboardPage — isAgencyTier() for all tab visibility
- Phase 5: Updated PaywallModal — 4-column feature comparison (Free/Pro/Std/Prem), wired checkout buttons
- Phase 5: Updated LandingPage — 4 pricing cards with new hourly billing model
- Phase 5: Updated AgencyAdminPanel — Shows sub-tutor count limits, proper tier badges
- Phase 5: Updated UsageBar — isAgencyTier() for credit exhaustion check
- Phase 6: Updated all 7 remaining API routes to use isAgencyTier() instead of hardcoded === 'AGENCY'
- Phase 7: Created missing /api/stripe/checkout route (was referenced but never existed)
- Phase 7: Updated src/lib/usage.ts — handles all 5 tiers correctly

Stage Summary:
- 0 TypeScript errors (tsc --noEmit clean)
- All lint errors are pre-existing, none from new code
- Schema pushed to Supabase successfully
- 17 files modified, 7 new files created
- Backward compatible: legacy AGENCY tier auto-migrates to AGENCY_STANDARD
