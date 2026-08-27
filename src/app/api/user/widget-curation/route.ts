import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('User')
      .select('widgetCuration')
      .eq('id', user.id)
      .single()

    const curation = profile?.widgetCuration || { hiddenWidgets: [], templates: [] }
    return NextResponse.json(curation)
  } catch (err: unknown) {
    console.error('[GET /api/user/widget-curation]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const hiddenWidgets: string[] = Array.isArray(body.hiddenWidgets) ? body.hiddenWidgets : []
    const templates: Array<{ id: string; name: string; hiddenKinds: string[]; createdAt: number }> = Array.isArray(body.templates) ? body.templates : []

    // Validate: only allow known canvas widget kinds to be hidden
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
    ])

    const validHidden = hiddenWidgets.filter((k: string) => ALLOWED_KINDS.has(k))

    // Validate template structure
    const validTemplates = templates.filter(t =>
      t && typeof t.id === 'string' && typeof t.name === 'string' &&
      Array.isArray(t.hiddenKinds) && typeof t.createdAt === 'number'
    )

    const curation = { hiddenWidgets: validHidden, templates: validTemplates }

    const { data, error } = await (supabase as any)
      .from('User')
      .update({ widgetCuration: curation })
      .eq('id', user.id)
      .select('widgetCuration')
      .single()

    if (error) throw error
    return NextResponse.json(data?.widgetCuration || curation)
  } catch (err: unknown) {
    console.error('[PUT /api/user/widget-curation]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
