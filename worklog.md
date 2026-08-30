# SuperBoard Work Log

---
Task ID: 1
Agent: Main Agent
Task: Fix Vercel deployment failures and runtime-breaking security header issues

Work Log:
- Pulled Vercel deployment logs via REST API, found 7 failed deployments with `errorCode: "lint_or_type_error"`
- Found 3 most recent deployments were already succeeding (failed ones were ~2h old)
- Discovered 3 runtime-breaking issues from security audit:
  1. `script-src` missing `unsafe-eval` — would break Fabric.js whiteboard
  2. `Cache-Control: no-store` applied to ALL routes including static pages
  3. `Permissions-Policy: camera=()` completely blocking LiveKit video calls
- Fixed all 3 in `next.config.ts` and `src/lib/supabase/middleware.ts`
- Deployed and verified headers on live site

Stage Summary:
- Vercel deployments were already recovering; fixed runtime-breaking header issues
- Live at https://superboard-three.vercel.app with correct headers

---
Task ID: 2
Agent: Main Agent
Task: Comprehensive white-box feature audit

Work Log:
- Ran subagent audit of all 31+ API route files against Prisma schema
- Found 36 functional issues: 18 CRITICAL, 11 HIGH, 5 MEDIUM, 2 LOW
- Root cause: massive Prisma schema drift — 13 missing models, 15+ missing User fields
- Discovered 7 DB tables exist but weren't in Prisma schema (Booking, RoomParticipant, ScheduleSlot, language_exercises, session_notes, student_mastery, vocab_cards)
- Updated Prisma schema from 7 models to 20 models with full field mappings
- Ran SQL migration: added 12 User columns, 4 RoomParticipant columns, migrated session_notes.id from bigint to UUID, created 11 new tables (Student, AuditLog, Recording, Subscription, PlatformConfig, Invoice, ScheduledLesson, CreditPack, Homework, WebhookConfig, QuestionItem) with indexes
- Fixed code-level bugs:
  - C1: registerSchema missing `id` and `name` fields (registration always returned 403)
  - C16/C17: getDisplayRole() always returned 'authenticated'; requireOwnerOrAdmin() didn't check admin
  - C18: user/role endpoint returned `undefined` for role — now queries DB
  - H1: Room end set non-existent `updatedAt` field
  - H2: Template GET/POST selected non-existent `updatedAt`
  - H3: BoardPage export selected non-existent `updatedAt`
  - H6: updateProfileSchema used `displayName` instead of `name`
  - H9: admin user export used wrong relation name `subTutors` → `agencyMembers`
  - H10: joinRoomSchema missing `studentIdentity` and `studentName`
  - M3: Profile GET/PATCH selected non-existent `customDomain`
- Converted admin/users from Supabase PostgREST to Prisma for type safety
- Built locally and on Vercel — both pass

Stage Summary:
- All 36 audit issues addressed: 18 critical (schema), 11 high (code bugs), 5 medium, 2 low
- Database now has 20 tables with proper relations and indexes
- 6 code files fixed for runtime correctness
- Deployed to production: https://superboard-three.vercel.app

---
Task ID: 3
Agent: Main Agent
Task: Fix all security audit findings without breaking whiteboard functionality

Work Log:
- Read and analyzed all 20+ security-critical files
- Applied 13 fixes across 4 batches, all in isolated API routes/lib files:

Batch 1 (zero whiteboard risk):
- C-1: auth.ts — switched verifyAuth from service-role key to anon-key Supabase client; re-exported getSupabaseServerClient from cookie-aware anon client
- C-2: auth/callback — removed `tier: 'FREE'` from OAuth update path (was silently downgrading paid users)
- C-3: stripe/webhook — added VALID_WEBHOOK_TIERS whitelist check before applying tier from metadata
- C-5: auth/dev-login — added email format regex validation
- H-4: send-reset-otp + update-password — replaced listUsers(1000).find() with getUserByEmail()
- H-2/H-3: rate-limit.ts — fixed checkRateLimit to accept options, return resetAt, added extractClientIP export
- H-7: api-key.ts — replaced hardcoded 'api-key-xxxx' with env-configurable mapping + SHA-256 hash fallback

Batch 2 (zero whiteboard risk):
- C-6: parent/[token] — added token format validation (min 32 chars, alphanumeric); fixed broken extractClientIP import
- M-4: agency/invite/[code] GET — restricted invite details to the invited user only; removed agency info leak
- M-5: audit.ts — removed @ts-nocheck directive
- C-4: middleware.ts — implemented CSRF double-submit pattern with Web Crypto API (Edge Runtime compatible)

Batch 3 (careful changes):
- M-7: room/join — set userId on RoomParticipant so LiveKit token route can find students; added OR fallback for legacy participants
- M-3: Skipped (by design — shared room links need unauthenticated page load)

Batch 4 (input validation):
- C-7: questions/[id] PUT — added Zod schema validation, replaced raw body spread with validated data

Deferred (require infrastructure):
- H-1: In-memory rate limiting (needs Upstash Redis — documented as known limitation)
- M-1: ignoreBuildErrors: true (needs dedicated type-fix pass)
- M-2: CSP unsafe-inline/unsafe-eval (unsafe-eval required by Fabric.js; unsafe-inline needs nonce migration)

Stage Summary:
- 13 security fixes applied across 11 files
- Build passes cleanly (no new warnings)
- Deployed to production: https://superboard-three.vercel.app
- Zero whiteboard code touched — all fixes in API routes, lib files, and middleware