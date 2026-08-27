import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })
    if (listError || !users) {
      return NextResponse.json({ error: 'Failed to look up account' }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update password using admin API (bypasses session requirement)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('update-password error:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('update-password exception:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
