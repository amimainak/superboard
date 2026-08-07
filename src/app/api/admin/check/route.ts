// ============================================================
// Admin API — Check Admin Status
// ============================================================
// GET — Returns whether the current user is an admin
// Used by the frontend to show/hide the admin panel
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { isAdmin: true },
    });

    return NextResponse.json({
      isAdmin: user?.isAdmin || false,
    });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
