import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check user exists
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })
    if (listError) {
      return NextResponse.json({ error: 'Failed to look up account' }, { status: 500 })
    }
    const user = users.users.find(u => u.email === email)
    if (!user) {
      // Don't reveal whether email exists — return success anyway
      return NextResponse.json({ success: true })
    }

    // Send OTP via GoTrue's signInWithOtp (admin mode)
    // This sends a 6-digit code to the user's email — NO URL needed
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      console.error('send-reset-otp error:', error.message)
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('send-reset-otp exception:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
