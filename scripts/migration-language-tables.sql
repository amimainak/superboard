-- ============================================================
-- Migration: Language Exercise & Mastery Tables for Superboard
-- Project: sjbxyxallfeyfuplacnn
-- ============================================================

-- 1. Language exercises (unified table for all exercise widget types)
CREATE TABLE IF NOT EXISTS public.language_exercises (
  id TEXT PRIMARY KEY,
  widget_kind TEXT NOT NULL,
  discriminator TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  band TEXT NOT NULL DEFAULT 'K-5',
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index SMALLINT NOT NULL DEFAULT 0,
  explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_sentence TEXT,
  passage TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Vocab cards (flashcard data)
CREATE TABLE IF NOT EXISTS public.vocab_cards (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT 'noun',
  level TEXT NOT NULL DEFAULT 'K-5',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student mastery tracking (replaces localStorage wb-perf-*)
CREATE TABLE IF NOT EXISTS public.student_mastery (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT,
  widget_kind TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, widget_kind, exercise_id)
);

-- 4. Session notes (replaces localStorage sb-notes-*)
CREATE TABLE IF NOT EXISTS public.session_notes (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lang_ex_kind ON public.language_exercises(widget_kind);
CREATE INDEX IF NOT EXISTS idx_lang_ex_disc ON public.language_exercises(discriminator);
CREATE INDEX IF NOT EXISTS idx_lang_ex_band ON public.language_exercises(band);
CREATE INDEX IF NOT EXISTS idx_lang_ex_diff ON public.language_exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocab_pos ON public.vocab_cards(pos);
CREATE INDEX IF NOT EXISTS idx_vocab_level ON public.vocab_cards(level);
CREATE INDEX IF NOT EXISTS idx_mastery_room ON public.student_mastery(room_id);
CREATE INDEX IF NOT EXISTS idx_mastery_room_widget ON public.student_mastery(room_id, widget_kind);
CREATE INDEX IF NOT EXISTS idx_session_notes_room ON public.session_notes(room_id);

-- RLS: Enable on all new tables
ALTER TABLE public.language_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: language_exercises (public read, service_role all)
CREATE POLICY "lang_ex_public_read" ON public.language_exercises FOR SELECT USING (true);
CREATE POLICY "lang_ex_service_role" ON public.language_exercises FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: vocab_cards (public read, service_role all)
CREATE POLICY "vocab_public_read" ON public.vocab_cards FOR SELECT USING (true);
CREATE POLICY "vocab_service_role" ON public.vocab_cards FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: student_mastery (authenticated users can read/write their room data, service_role all)
CREATE POLICY "mastery_room_read" ON public.student_mastery FOR SELECT USING (true);
CREATE POLICY "mastery_room_insert" ON public.student_mastery FOR INSERT WITH CHECK (true);
CREATE POLICY "mastery_room_update" ON public.student_mastery FOR UPDATE USING (true);
CREATE POLICY "mastery_room_delete" ON public.student_mastery FOR DELETE USING (true);
CREATE POLICY "mastery_service_role" ON public.student_mastery FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies: session_notes (public read/write for simplicity, service_role all)
CREATE POLICY "notes_public_read" ON public.session_notes FOR SELECT USING (true);
CREATE POLICY "notes_public_insert" ON public.session_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "notes_public_update" ON public.session_notes FOR UPDATE USING (true);
CREATE POLICY "notes_public_delete" ON public.session_notes FOR DELETE USING (true);
CREATE POLICY "notes_service_role" ON public.session_notes FOR ALL USING (auth.role() = 'service_role');

-- Update timestamp trigger for student_mastery
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_mastery_updated_at
  BEFORE UPDATE ON public.student_mastery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
