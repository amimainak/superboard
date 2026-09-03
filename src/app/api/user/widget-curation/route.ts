// ============================================================
// API Route: User Widget Curation
// ============================================================
// GET:  Return the user's widget curation data (hidden widgets + templates).
// PUT:  Update the user's widget curation data.
// ============================================================
//
// NOTE: The Prisma User schema has no `widgetCuration` column.
// Widget curation is persisted inside the existing `installedWidgets`
// Json field under a `widgetCuration` key, so the rest of the
// application (which reads `installedWidgets` for the active widget
// list) is unaffected.

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// The list of canvas widget kinds the user is allowed to hide.
const ALLOWED_KINDS = new Set([
  // Math
  'math-fraction-circle', 'math-fraction-bar', 'math-number-line', 'math-angle-maker',
  'math-polygon', 'math-coordinate-plane', 'math-venn-diagram', 'math-bar-chart',
  'math-pie-chart', 'math-place-value', 'math-clock', 'math-base-10',
  'math-multiplication-array', 'math-function-plotter', 'math-protractor', 'math-ruler',
  'math-set-square', 'math-compass', 'math-multiplication-grid', 'math-flashcards',
  'math-calculator', 'math-unit-converter', 'math-formula-reference', 'math-proof-builder',
  // Physics
  'phys-formula-calc', 'phys-wave-sim', 'phys-pendulum-sim', 'phys-unit-converter',
  'phys-projectile-sim', 'phys-ohms-law', 'phys-circuit-diagram', 'phys-free-body-diagram',
  'phys-ray-diagram', 'phys-energy-bar-charts', 'phys-interactive-graphing',
  // Chemistry
  'chem-periodic-table', 'chem-equation-balancer', 'chem-ph-scale', 'chem-sci-notation',
  'chem-molar-mass', 'chem-lewis-dot', 'chem-vsepr', 'chem-gas-laws',
  'chem-titration', 'chem-ion-formation',
  // Biology
  'bio-cell-diagram', 'bio-dna-transcription', 'bio-punnett-square', 'bio-ecosystem',
  'bio-human-body', 'bio-evolution-tree', 'bio-photosynthesis', 'bio-respiration',
  'bio-food-web', 'bio-classification',
  // Language
  'lang-pos-tagger', 'lang-sentence-builder', 'lang-word-family', 'lang-syllable-counter',
  'lang-rhyme-finder', 'lang-analogy-solver', 'lang-context-clues', 'lang-figurative-lang',
  'lang-text-structure', 'lang-vocabulary-builder', 'lang-spelling-patterns',
  'lang-grammar-diagnostic', 'lang-reading-strategies', 'lang-writing-checklist',
  'lang-phonics', 'lang-root-morphology', 'lang-active-passive', 'lang-punctuation',
  'lang-story-elements', 'lang-persuasive-writing', 'lang-vocab-flashcards',
  'lang-conjunctions', 'lang-prefix-suffix',
  // Statistics
  'stat-data-table', 'stat-histogram', 'stat-box-plot', 'stat-scatter',
  'stat-normal-dist', 'stat-probability',
  // Earth Science
  'earth-layers', 'earth-plate-tectonics', 'earth-rock-cycle', 'earth-water-cycle',
  'earth-weather-map', 'earth-solar-system',
  // Classroom
  'classroom-timer', 'classroom-random-picker', 'classroom-scoreboard', 'classroom-behavior-tracker',
]);

type WidgetCuration = {
  hiddenWidgets: string[];
  templates: Array<{ id: string; name: string; hiddenKinds: string[]; createdAt: number }>;
};

const EMPTY_CURATION: WidgetCuration = { hiddenWidgets: [], templates: [] };

/**
 * Extract the widgetCuration sub-object from the User.installedWidgets
 * Json blob. The blob may be null/unknown shape; fall back to empty.
 */
function extractCuration(raw: unknown): WidgetCuration {
  if (!raw || typeof raw !== 'object') return EMPTY_CURATION;
  const blob = raw as Record<string, unknown>;
  const curation = blob.widgetCuration;
  if (!curation || typeof curation !== 'object') return EMPTY_CURATION;
  const c = curation as Record<string, unknown>;
  const hiddenWidgets = Array.isArray(c.hiddenWidgets)
    ? c.hiddenWidgets.filter((k): k is string => typeof k === 'string')
    : [];
  const templates = Array.isArray(c.templates)
    ? c.templates.filter(
        (t): t is { id: string; name: string; hiddenKinds: string[]; createdAt: number } =>
          !!t &&
          typeof t === 'object' &&
          typeof (t as Record<string, unknown>).id === 'string' &&
          typeof (t as Record<string, unknown>).name === 'string' &&
          Array.isArray((t as Record<string, unknown>).hiddenKinds) &&
          typeof (t as Record<string, unknown>).createdAt === 'number',
      )
    : [];
  return { hiddenWidgets, templates };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { installedWidgets: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(extractCuration(user.installedWidgets));
  } catch (err: unknown) {
    console.error('[GET /api/user/widget-curation]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const hiddenWidgets: string[] = Array.isArray(body?.hiddenWidgets) ? body.hiddenWidgets : [];
    const templates: WidgetCuration['templates'] = Array.isArray(body?.templates) ? body.templates : [];

    // Validate: only allow known canvas widget kinds to be hidden
    const validHidden = hiddenWidgets.filter((k: string) => ALLOWED_KINDS.has(k));

    // Validate template structure
    const validTemplates = templates.filter(
      (t) =>
        t &&
        typeof t.id === 'string' &&
        typeof t.name === 'string' &&
        Array.isArray(t.hiddenKinds) &&
        typeof t.createdAt === 'number',
    );

    const curation: WidgetCuration = { hiddenWidgets: validHidden, templates: validTemplates };

    // Read the existing installedWidgets blob so we don't blow away
    // any other keys that consumers may have stored there.
    const existing = await db.user.findUnique({
      where: { id: auth.userId },
      select: { installedWidgets: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const baseBlob: Prisma.JsonObject =
      existing.installedWidgets && typeof existing.installedWidgets === 'object'
        ? { ...(existing.installedWidgets as Prisma.JsonObject) }
        : {};
    baseBlob.widgetCuration = curation as unknown as Prisma.JsonValue;

    const updated = await db.user.update({
      where: { id: auth.userId },
      data: { installedWidgets: baseBlob },
      select: { installedWidgets: true },
    });

    return NextResponse.json(extractCuration(updated.installedWidgets));
  } catch (err: unknown) {
    console.error('[PUT /api/user/widget-curation]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
