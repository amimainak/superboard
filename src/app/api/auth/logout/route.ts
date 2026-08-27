// ============================================================
// POST /api/auth/logout
// ============================================================
// Signs the user out and clears the Supabase auth cookies.
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth';

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: 'Signed out' });
  } catch (err) {
    console.error('[Auth Logout] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
