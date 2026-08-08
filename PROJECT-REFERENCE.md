# Superboard — Project Reference

## Live Deployment URL
**Production URL:** https://my-project-alpha-sooty-87.vercel.app/

## Project Key Facts
- **Business:** Superboard — AI-powered tutoring whiteboard SaaS for K-12 tutors
- **Entity:** Sole Proprietorship, India
- **Market:** ~70-80% global freelance tutors, ~20-30% agencies
- **Payment:** Stripe India (LUT filed, zero-rated exports)
- **GSTIN:** Pending registration
- **SAC Code:** 998314
- **Database:** Supabase (PostgreSQL)
- **Framework:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui

## Subscription Tiers
| Tier | Price | Details |
|------|-------|---------|
| FREE | $0/mo | Limited features |
| PRO | $10/mo ($96/yr) | Full toolkit for individual tutors |
| AGENCY_STANDARD | $39/mo + $3/hr | Up to 5 sub-tutors |
| AGENCY_PREMIUM | $79/mo + $2/hr | Unlimited sub-tutors |

## Contact Emails (placeholders)
- support@superboard.live
- sales@superboard.live
- legal@superboard.live
- privacy@superboard.live
- grievance@superboard.live
- abuse@superboard.live

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@superboard.app | TestPass123! |
| Free Tutor | free-tutor@superboard.app | TestPass123! |
| Pro Tutor | pro-tutor@superboard.app | TestPass123! |
| Agency (Admin) | agency@superboard.app | TestPass123! |

## Pending Tasks
- [ ] Create 4 Stripe prices in Stripe Dashboard and set env vars
- [ ] Test student join flow end-to-end
- [ ] Apply Prisma migration to Supabase if not already done
- [ ] Fill in proprietor name, GSTIN, registered address on Contact page
- [ ] Get Indian lawyer to review legal pages before going live
- [ ] Update domain references in legal pages once custom domain is set
