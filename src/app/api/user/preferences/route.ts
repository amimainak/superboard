// ============================================================
// API Route: Tutor Preferences  (F-06)
// ============================================================
// GET   /api/user/preferences
//   Returns the tutor's preferences JSON. Each key is normalized
//   to its default if missing — callers never have to handle
//   undefined.
//
// PATCH /api/user/preferences
//   Updates one or more preference keys. Performs a read-modify-
//   write so unspecified keys are preserved (no accidental resets).
//
// Preference registry (add new keys here):
//   startLessonFromProfile  (bool, default true)
//     Show the "Start Next Lesson" button on student profiles.
//   startLessonFromLibrary  (bool, default true)
//     Show the "Start Lesson" button on board library rows.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// ----------------------------------------------------------------
// Preference registry — single source of truth for keys + defaults.
// To add a new preference: add it here, then surface it in the UI.
// No migration needed — the column is Json.
// ----------------------------------------------------------------
export const PREFERENCE_DEFAULTS = {
  startLessonFromProfile: true,
  startLessonFromLibrary: true,
} as const;

export type PreferenceKey = keyof typeof PREFERENCE_DEFAULTS;
export type Preferences = { [K in PreferenceKey]: boolean };

function normalize(raw: unknown): Preferences {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    startLessonFromProfile: typeof obj.startLessonFromProfile === 'boolean' ? obj.startLessonFromProfile : PREFERENCE_DEFAULTS.startLessonFromProfile,
    startLessonFromLibrary: typeof obj.startLessonFromLibrary === 'boolean' ? obj.startLessonFromLibrary : PREFERENCE_DEFAULTS.startLessonFromLibrary,
  };
}

// ----------------------------------------------------------------
// GET
// ----------------------------------------------------------------
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ preferences: normalize(user.preferences) });
  } catch (error) {
    console.error('[Preferences GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// PATCH — read-modify-write to preserve unspecified keys
// ----------------------------------------------------------------
const patchSchema = z.object({
  startLessonFromProfile: z.boolean().optional(),
  startLessonFromLibrary: z.boolean().optional(),
}).strict();

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Read current value, merge with the patch, write back.
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { preferences: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const current = normalize(user.preferences);
    const next: Preferences = { ...current, ...parsed.data };

    await db.user.update({
      where: { id: auth.userId },
      data: { preferences: next as unknown as object },
    });

    return NextResponse.json({ preferences: next });
  } catch (error) {
    console.error('[Preferences PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
