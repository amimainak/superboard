import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const OWNER_EMAIL = 'thephysicsmathtutor@gmail.com'

// POST /api/admin/setup-owner
// One-time setup: creates the platform owner account.
// Requires SETUP_SECRET env var to prevent abuse.
// Uses SUPABASE_SERVICE_ROLE_KEY for admin-level operations.
export async function POST(request: Request) {
  const secret = process.env.SETUP_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SETUP_SECRET not configured' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const providedSecret = (body as { secret?: string }).secret
  if (providedSecret !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // 1. Check if user already exists in Supabase Auth
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingAuth = listData?.users?.find(u => u.email === OWNER_EMAIL)

    let userId: string
    let isNewUser = false

    if (existingAuth) {
      userId = existingAuth.id
    } else {
      // Create the auth user with a temporary password
      const crypto = await import('crypto')
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      const password = Array.from(crypto.randomBytes(20)).map((b: number) => chars[b % chars.length]).join('')

      const { data, error } = await supabase.auth.admin.createUser({
        email: OWNER_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { name: 'Superboard Owner' },
      })

      if (error) {
        return NextResponse.json({ error: 'Failed to create auth user: ' + error.message }, { status: 500 })
      }

      userId = data.user.id
      isNewUser = true
    }

    // 2. Upsert User record with owner role
    // Try with role column first, fall back to without if column doesn't exist
    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single()

    const diagnostics: Array<{ step: string; success: boolean; error?: string }> = []

    if (existing) {
      const { error: updateErr } = await supabase
        .from('User')
        .update({ role: 'owner', isAdmin: true, tier: 'AGENCY' })
        .eq('id', userId)
      if (updateErr) {
        // role column might not exist, try without it
        diagnostics.push({ step: 'update_with_role', success: false, error: updateErr.message })
        const { error: updateErr2 } = await supabase
          .from('User')
          .update({ isAdmin: true, tier: 'AGENCY' })
          .eq('id', userId)
        diagnostics.push({ step: 'update_no_role', success: !updateErr2, error: updateErr2?.message })
      } else {
        diagnostics.push({ step: 'update_with_role', success: true })
      }
    } else {
      const { error: insertErr } = await supabase
        .from('User')
        .insert({
          id: userId,
          email: OWNER_EMAIL,
          name: 'Superboard Owner',
          tier: 'AGENCY',
          role: 'owner',
          isAdmin: true,
        })
      if (insertErr) {
        diagnostics.push({ step: 'insert_with_role', success: false, error: insertErr.message })
        // Try without role column
        const { error: insertErr2 } = await supabase
          .from('User')
          .insert({
            id: userId,
            email: OWNER_EMAIL,
            name: 'Superboard Owner',
            tier: 'AGENCY',
            isAdmin: true,
          })
        diagnostics.push({ step: 'insert_no_role', success: !insertErr2, error: insertErr2?.message })
        if (insertErr2) {
          return NextResponse.json({
            success: false,
            isNewUser,
            diagnostics,
            error: 'Failed to create User record: ' + insertErr2.message,
          }, { status: 500 })
        }
      } else {
        diagnostics.push({ step: 'insert_with_role', success: true })
      }
    }

    // 3. Verify
    const { data: verify } = await supabase
      .from('User')
      .select('id, email, tier, isAdmin')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      user: verify,
      isNewUser,
      diagnostics,
      authUserId: userId,
      message: isNewUser
        ? 'Owner account created. Check your email to set a password, or use "Forgot Password" at /login.'
        : 'Existing account promoted to owner role.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Setup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
