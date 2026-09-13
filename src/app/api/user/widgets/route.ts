import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ============================================================
// /api/user/widgets — GET/PUT the tutor's widget prefs.
//
// Stored shape (in the User.installedWidgets Json column):
//   { tools: string[], subjects: string[] }
//
// Backward-compat: if the stored value is a plain array (legacy),
// it is treated as the old "installedTools" list and `subjects`
// defaults to an empty array on read.
// ============================================================

// Marketplace tool IDs that may be installed (Phase 2 language tools).
const ALLOWED_TOOL_IDS: string[] = [
  'lang-root-morphology',
  'lang-active-passive',
  'lang-reading-strategies',
  'lang-grammar-diagnostic',
  'lang-spelling-patterns',
]

// The 9 subject toolkit IDs a tutor can pin to their toggle bar.
const ALLOWED_SUBJECT_IDS: string[] = [
  'math',
  'physics',
  'chemistry',
  'biology',
  'language',
  'statistics',
  'earthscience',
  'arts',
  'classroom',
]

/** Coerce a raw `installedWidgets` JSON value into the structured shape. */
function coerceShape(raw: unknown): { tools: string[]; subjects: string[] } {
  if (Array.isArray(raw)) {
    // Legacy shape — array of marketplace tool IDs.
    return { tools: raw.filter((x): x is string => typeof x === 'string'), subjects: [] }
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const tools = Array.isArray(obj.tools)
      ? obj.tools.filter((x): x is string => typeof x === 'string')
      : []
    const subjects = Array.isArray(obj.subjects)
      ? obj.subjects.filter((x): x is string => typeof x === 'string')
      : []
    return { tools, subjects }
  }
  return { tools: [], subjects: [] }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('User')
      .select('installedWidgets')
      .eq('id', user.id)
      .single()

    const shape = coerceShape(profile?.installedWidgets)
    return NextResponse.json({
      installedTools: shape.tools,
      installedSubjects: shape.subjects,
    })
  } catch (err: unknown) {
    console.error('[GET /api/user/widgets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Validate incoming tool IDs (only known marketplace tools allowed).
    const rawTools: unknown = body.installedTools
    const tools: string[] = Array.isArray(rawTools)
      ? rawTools.filter((id: unknown): id is string => typeof id === 'string' && ALLOWED_TOOL_IDS.includes(id as string))
      : []

    // Validate incoming subject IDs (only the 9 known toolkits allowed).
    const rawSubjects: unknown = body.installedSubjects
    const subjects: string[] = Array.isArray(rawSubjects)
      ? rawSubjects.filter((id: unknown): id is string => typeof id === 'string' && ALLOWED_SUBJECT_IDS.includes(id as string))
      : []

    // Persist the structured shape. If the client only sent one of the two
    // arrays, we still write the other so the column stays in sync (empty
    // array = "no tools/subjects pinned", not "preserve previous value").
    const nextValue = { tools, subjects }

    const { data, error } = await (supabase as any)
      .from('User')
      .update({ installedWidgets: nextValue })
      .eq('id', user.id)
      .select('installedWidgets')
      .single()

    if (error) throw error
    const shape = coerceShape(data?.installedWidgets)
    return NextResponse.json({
      installedTools: shape.tools,
      installedSubjects: shape.subjects,
    })
  } catch (err: unknown) {
    console.error('[PUT /api/user/widgets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
