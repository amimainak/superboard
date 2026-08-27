import { NextResponse } from 'next/server'

const PRODUCTION_URL = 'https://superboard-three.vercel.app/login'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    // Call GoTrue recover endpoint directly with service role key.
    // The service role bypasses URI allow-list restrictions.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const res = await fetch(supabaseUrl + '/auth/v1/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
      },
      body: JSON.stringify({
        email,
        redirect_to: PRODUCTION_URL,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('GoTrue recover error:', res.status, errBody)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Reset password error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
