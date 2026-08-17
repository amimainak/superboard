# Task 3a: Create getAuthenticatedUser() helper + add auth guards

## Files Created
- `src/lib/auth-guard.ts` — Reusable `getAuthenticatedUser()` helper that returns `{ user, response }`. All API routes import this for consistent auth gating.

## Files Modified

### Auth Guards (replaced inline `supabase.auth.getUser()` with `getAuthenticatedUser()`)
1. `src/app/api/rooms/[roomId]/pages/route.ts` — GET + PUT
2. `src/app/api/rooms/[roomId]/pages/[pageIndex]/route.ts` — GET + PUT
3. `src/app/api/usage/route.ts` — GET + POST
4. `src/app/api/livekit/token/route.ts` — POST (also removed unused `createClient` import)

### A-03: Profile self-upgrade prevention
5. `src/lib/validations.ts` — `updateProfileSchema`: replaced `name` with `displayName`, added `avatarUrl`, added safety comment about excluded fields (tier, email, id, isAdmin)
6. `src/app/api/user/profile/route.ts` — PATCH handler: updated to destructure new field names, added explicit safety comment

### A-05: Usage minutes validation
7. `src/app/api/usage/route.ts` — Added `MAX_SESSION_MINUTES = 180` check: rejects heartbeat if total period usage would exceed 180 minutes (returns 429)

### A-11: Open redirect prevention
8. `src/app/api/auth/callback/route.ts` — Replaced string-based check with `SAFE_REDIRECT_RE` regex that only allows safe relative paths (rejects `//`, backslashes, encoded chars, absolute URLs)

## Notes
- `@supabase/ssr` was already in `package.json` — no install needed
- All lint errors from modified files are pre-existing warnings (unused eslint-disable directives), zero new errors introduced
- LiveKit token route already forced `participantIdentity = user.id` — confirmed correct, no change needed there
