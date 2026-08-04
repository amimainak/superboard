---
Task ID: 2
Agent: Super Z (Main)
Task: Apply 33 fixes — Security, API endpoints, Code bugs, Polish

Work Log:
- Read BLUEPRINT_v4.0_FINAL.md for architecture constraints
- Created src/lib/auth.ts — shared JWT auth helper (verifyAuth, requireAuth)
- Fixed src/lib/supabase.ts — createServerClient() now uses SUPABASE_SERVICE_ROLE_KEY
- Created src/lib/auth-fetch.ts — client-side authFetch() helper that auto-injects Bearer token
- Added auth guards to ALL 7 API routes: /api/room, /api/auth/register, /api/auth/profile, /api/ai/action, /api/usage/fingerprint, /api/usage/current
- Fixed src/lib/fingerprint.ts — reportFingerprint() now accepts userId parameter
- Added GET /api/room?tutorId= support to room route (lists rooms for a tutor)
- Created /api/room/templates/route.ts (GET + POST for Template CRUD)
- Created /api/usage/agency/route.ts (GET agency sub-tutor usage)
- Fixed QuizGenerator.tsx — sends prompt + userId instead of payload
- Fixed WorksheetGenerator.tsx — same payload->prompt fix
- Updated ALL client fetch() calls in page.tsx to use authFetch()
- Fixed dynamic Tailwind classes in testimonials (color map approach)
- Fixed hydration mismatch in useRoomId() hook (useParams pattern)
- Fixed DATABASE_URL pgbouncer param appending (string-based, not new URL())
- Centralized tier limits in usage/current (imports TIER_LIMITS from types)
- Fixed null safety in supabase.ts (removed 'as unknown as' pattern)
- Fixed tutor seeing waiting room on load (added useEffect sync with isTutor)
- Fixed PipVideoPanel disappearing on leave call (separate inCall state)
- Fixed auth loading race condition in page.tsx (mounted flag + onAuthStateChange)
- Wired Toolbar SubjectAIToolkitLoader to actual AI feature buttons per blueprint
- Fixed CLS on BrandedHeader and WaitingRoom img tags (width/height/loading)
- Build verified: all 14 routes compile, 0 errors

Stage Summary:
- 31 fixes applied successfully (2 deferred: TypeScript strict mode needs Tldraw types, Stripe checkout needs Stripe keys)
- All files created/modified: auth.ts, auth-fetch.ts, supabase.ts, db.ts, fingerprint.ts, 7 API routes, 2 new API routes, page.tsx, room page, Whiteboard.tsx, PipVideoPanel.tsx, Toolbar.tsx, BrandedHeader.tsx, WaitingRoom.tsx, QuizGenerator.tsx, WorksheetGenerator.tsx
- Build passes cleanly
