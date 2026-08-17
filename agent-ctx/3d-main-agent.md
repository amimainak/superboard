# Task 3d: SQL Migration for RoomParticipant + Enhanced RLS

## Status: COMPLETED

### What was done
- Created `scripts/migration_v2.sql` — a comprehensive, idempotent Supabase SQL migration file

### File created
- `scripts/migration_v2.sql` (~170 lines)

### Migration sections
1. **RoomParticipant table**: id, room_id, user_id, role (host/participant/viewer), joined_at, left_at, is_online, UNIQUE constraint, 2 indexes
2. **5 RLS policies on RoomParticipant**: SELECT (participants + host), INSERT (self-join), UPDATE host-only (role changes), UPDATE self-only (leave), DELETE (self or host)
3. **2 ChatMessage RLS policies**: UPDATE own messages, DELETE own or host can delete any (uses RoomParticipant.role='host')
4. **Users tier-escalation guard**: Enhanced `users_update_own` policy with WITH CHECK preventing tier changes (A-03 defense-in-depth)
5. **Optional backfill** (commented out): Populates RoomParticipant from existing ChatMessage history

### Design decisions
- All policies are idempotent (IF NOT EXISTS or DO $$ drop-and-recreate)
- ChatMessage DELETE now uses RoomParticipant for host detection (consistent with new auth model)
- Tier guard works alongside existing trigger (belt-and-suspenders)
