// ============================================================
// API Route: Auth Profile
// ============================================================
// Returns the user's profile from our PostgreSQL database.
// Now requires auth — the caller's JWT must match the requested userId.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // --- Auth check: caller can only read their own profile ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Use authenticated user's ID if userId param not provided
    const targetUserId = userId || auth.userId;

    // Security: caller can only read their own profile (or their sub-tutors if agency)
    if (userId && userId !== auth.userId) {
      // Agency owners can view sub-tutor profiles
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      if (!caller || caller.tier !== 'AGENCY') {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own profile' },
          { status: 403 }
        );
      }
      // Check if the target is a sub-tutor under this agency.
      // Fetch full profile fields now to avoid a redundant second query.
      const target = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          brandingColor: true,
          brandingLogoUrl: true,
          customDomain: true,
          parentAgencyId: true,
        },
      });
      if (!target || target.parentAgencyId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own or sub-tutor profiles' },
          { status: 403 }
        );
      }
      // Target already fetched with full fields — return directly
      return NextResponse.json(target);
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        brandingColor: true,
        brandingLogoUrl: true,
        customDomain: true,
        parentAgencyId: true,
      },
    });

    if (!user) {
      // User exists in Supabase Auth but not in our DB yet.
      // Return defaults so the app doesn't crash.
      return NextResponse.json({
        tier: 'FREE',
        name: null,
        brandingColor: null,
        brandingLogoUrl: null,
        customDomain: null,
        parentAgencyId: null,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[Auth Profile] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
