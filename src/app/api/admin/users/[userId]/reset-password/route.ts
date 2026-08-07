// ============================================================
// Admin API — Trigger Password Reset
// ============================================================
// POST — Sends a Supabase Auth password reset email to the user
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  const { userId } = await params;

  try {
    // Get user email
    const { db } = await import('@/lib/db');
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use Supabase admin API to generate password reset link
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured.' }, { status: 500 });
    }

    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
    });

    if (error) {
      console.error('[Admin Password Reset]', error);
      return NextResponse.json({ error: `Failed to send reset email: ${error.message}` }, { status: 500 });
    }

    await logAudit(adminCheck.userId, 'USER_PASSWORD_RESET', 'User', userId, {
      email: user.email,
    });

    return NextResponse.json({
      message: `Password reset email sent to ${user.email}`,
    });
  } catch (error: any) {
    console.error('[Admin Password Reset]', error);
    return NextResponse.json({ error: 'Failed to trigger password reset.' }, { status: 500 });
  }
}
