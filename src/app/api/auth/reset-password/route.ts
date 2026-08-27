// ============================================================
// POST /api/auth/reset-password
// ============================================================
// Sends a password reset email via GoTrue.
// SECURITY FIX (AUDIT-HIGH-5): Added rate limiting (5 per 15 min per IP)
// to prevent email bombing / spam.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const PRODUCTION_URL = 'https://superboard-three.vercel.app/login'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed, retryAfterMs } = rateLimit(`reset-pw:${ip}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      )
    }

    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const res = await fetch(supabaseUrl + '/auth/v1/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
      },
      body: JSON.stringify({ email, redirect_to: PRODUCTION_URL }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('GoTrue recover error:', res.status, errBody)
      // Don't reveal whether email exists
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Reset password error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
