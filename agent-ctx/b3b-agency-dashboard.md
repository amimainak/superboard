# Task b3b: Agency Dashboard + Multi-Tutor Management

## Files Created
- `src/app/api/agency/route.ts` — GET (list members), POST (invite tutor), DELETE (remove member/revoke invite)
- `src/app/api/agency/invite/[code]/route.ts` — GET (invite details), POST (accept invite)
- `src/components/room/widgets/AgencyWidget.tsx` — Full agency management UI widget

## Files Modified
- `src/lib/room/widget-store.ts` — Added `'agency'` and `'breakout'` to WidgetId union, added entries to AVAILABLE_WIDGETS array
- `src/components/room/widgets/WidgetPanel.tsx` — Added dynamic import + render case for AgencyWidget and BreakoutRoomsWidget
- `src/components/room/widgets/WidgetToggleBar.tsx` — Added Building2 and LayoutGrid icon SVGs
- `src/components/room/widgets/index.ts` — Added barrel exports

## Implementation Details
- GET /api/agency: Queries User for agency name, AgencyMember for tutors, Room for session counts, AgencyInvite for pending invites. Returns structured JSON with agency info, member list (including owner), and pending invites.
- POST /api/agency: Validates email, checks AGENCY tier, generates random 6-char invite code, inserts AgencyInvite with 7-day expiry. Rate limited at 20/hr.
- DELETE /api/agency: Supports memberId (remove from AgencyMember) and inviteId (revoke invite) query params.
- POST /api/agency/invite/[code]: Validates invite code, checks status/expiry, inserts AgencyMember, updates User.parentAgencyId, marks invite accepted.
- AgencyWidget: Complete UI with invite form, member list with session counts, pending invites with revoke, invite link with copy button. Follows existing widget CSS patterns.
