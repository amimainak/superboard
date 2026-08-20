---
Task ID: 1
Agent: Main Agent
Task: Migrate all localStorage and static data references to Supabase

Work Log:
- Verified Supabase connection with anon key (project ref: sjbxyxallfeyfuplacnn)
- Audited all localStorage usage: performance-persistence.ts, SessionNotesWidget.tsx, ParentPortalWidget.tsx, RecordingWidget.tsx
- Created migration SQL (scripts/migration-language-tables.sql) for 4 new tables: language_exercises, vocab_cards, student_mastery, session_notes
- Created seed script (scripts/seed-language-data.ts) to upload ~873 exercises + 209 vocab cards
- Created 4 API routes: /api/lang/exercises, /api/lang/vocab, /api/lang/mastery, /api/rooms/[roomId]/notes
- Rewrote performance-persistence.ts: localStorage → Supabase API with client-side cache
- Rewrote SessionNotesWidget.tsx: localStorage → Supabase API
- Updated ParentPortalWidget.tsx: localStorage notes check → Supabase API
- Created useSupabaseExercises hook for widgets to fetch from API with static fallback
- Updated 5 exercise widgets (Punctuation, SentenceStructure, Phonics, FigurativeLanguage, SentenceExpansion) + VocabFlashcards to use Supabase
- Fixed all TypeScript null-safety errors in widgets
- Build verified: 0 TypeScript errors

Stage Summary:
- All code changes complete and type-safe
- BLOCKER: Need database password to run the CREATE TABLE migration
- User must: 1) Run SQL migration in Supabase Dashboard, 2) Run seed script, 3) Update Vercel env vars to match new project
- Files created: migration-language-tables.sql, seed-language-data.ts, run-language-migration.js, useSupabaseExercises.ts, 4 API route files
- Files modified: performance-persistence.ts, SessionNotesWidget.tsx, ParentPortalWidget.tsx, 5 widget files, vercel-env-setup.sh, .env.local
