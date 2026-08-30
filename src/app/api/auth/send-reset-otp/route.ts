// ============================================================
// POST /api/auth/send-reset-otp
// ============================================================
// SECURITY FIX (AUDIT-CRIT-2): Previously this endpoint had NO
// authentication and NO rate limiting — anyone could trigger OTP
// emails to any address, enabling spam and OTP enumeration.
//
// Hardened version:
//   - Requires ADMIN auth (JWT Bearer token)
//   - Rate limited (5 per 15 minutes per admin IP)
//   - Validates email format
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // --- 1. Admin-only auth check ---
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    // --- 2. Rate limit (5 per 15 min per admin IP) ---
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, retryAfterMs } = rateLimit(
      `admin:send-otp:${ip}`,
      5,
      15 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    // --- 3. Parse and validate input ---
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // --- 4. Admin-only Supabase client ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // --- 5. Check user exists (direct lookup instead of listing all users) ---
    const { data: user, error: lookupError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    if (lookupError) {
      // Don't reveal whether email exists — return success anyway
      return NextResponse.json({ success: true });
    }
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // --- 6. Send OTP ---
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      console.error('[send-reset-otp] error:', error.message);
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }

    console.warn(`[send-reset-otp] Admin ${adminCheck.userId} sent OTP to ${email}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[send-reset-otp] exception:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
