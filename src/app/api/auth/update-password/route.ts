// ============================================================
// POST /api/auth/update-password
// ============================================================
// SECURITY FIX (AUDIT-CRIT-1): Previously this endpoint had NO auth,
// NO rate limiting, and NO verification — anyone could reset any
// user's password by calling it with an email + newPassword.
//
// Hardened version:
//   - Requires ADMIN auth (JWT Bearer token)
//   - Rate limited (3 attempts per 15 minutes)
//   - Password strength validation (min 8 chars, mixed case + digit)
//   - Uses SUPABASE_SERVICE_ROLE_KEY for admin password update
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Password strength: min 8 chars, at least one uppercase, one lowercase, one digit
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    // --- 1. Admin-only auth check ---
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    // --- 2. Rate limit (3 per 15 min per admin IP) ---
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, retryAfterMs } = rateLimit(
      `admin:pw-reset:${ip}`,
      3,
      15 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    // --- 3. Parse and validate input ---
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    if (!PASSWORD_RE.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must include uppercase, lowercase, and a digit' },
        { status: 400 },
      );
    }

    // --- 4. Admin-only Supabase client ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // --- 5. Look up user by email ---
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listError || !users) {
      return NextResponse.json({ error: 'Failed to look up account' }, { status: 500 });
    }

    const user = users.users.find((u) => u.email === email);
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true });
    }

    // --- 6. Update password ---
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateError) {
      console.error('[update-password] error:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.warn(`[update-password] Admin ${adminCheck.userId} reset password for ${email}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[update-password] exception:', e);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
