// ============================================================
// POST /api/auth/login
// ============================================================
// Email/password login via Supabase Auth.
// Sets session cookies on the server-side client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
