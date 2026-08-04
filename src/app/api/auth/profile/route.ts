// ============================================================
// API Route: Auth Profile
// ============================================================
// Returns the user's profile from our PostgreSQL database.
// Called after Supabase Auth confirms the user is logged in.
// Returns tier, branding, and other profile data.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
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
