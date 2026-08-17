import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, updateProfileSchema } from '@/lib/validations'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newProfile, error } = await (supabase as any)
        .from('User')
        .insert({
          id: user.id,
          email: (user.email ?? ''),
          name: user.user_metadata?.name || (user.email ?? '').split('@')[0],
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(newProfile)
    }

    return NextResponse.json(profile)
  } catch (err: unknown) {
    console.error('[GET /api/user/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(updateProfileSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    // A-03: Only extract explicitly-safe fields.
    // NEVER spread parsed directly — it could include tier, email, id if schema changes.
    const { displayName, avatarUrl, bio, timezone, brandingColor, brandingLogoUrl } = parsed
    const updates: Record<string, unknown> = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
    if (bio !== undefined) updates.bio = bio
    if (timezone !== undefined) updates.timezone = timezone
    if (brandingColor !== undefined) updates.brandingColor = brandingColor
    if (brandingLogoUrl !== undefined) updates.brandingLogoUrl = brandingLogoUrl

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('User')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[PATCH /api/user/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
