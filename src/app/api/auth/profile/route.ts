// ============================================================
// API Route: Auth Profile
// ============================================================
// Returns the user's profile from our PostgreSQL database.
// Now requires auth — the caller's JWT must match the requested userId.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';
import { z } from 'zod';

// SECURITY FIX (API-M09): Zod schema validation for profile PATCH
const updateProfileSchema = z.object({
  brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').max(7).optional().nullable(),
  brandingLogoUrl: z.string().url('Invalid URL format').max(500).optional().nullable(),
  name: z.string().max(200, 'Name too long (max 200 characters)').optional(),
});

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
      if (!caller || !isAgencyTier(caller.tier)) {
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
        parentAgencyId: true,
      },
    });

    if (!user) {
      // User exists in Supabase Auth but not in our DB yet.
      // Auto-create profile for OAuth users (Google, etc.)
      try {
        const newUser = await db.user.create({
          data: {
            id: targetUserId,
            email: '', // Will be updated from auth metadata below
            tier: 'FREE',
            name: null,
          },
        });
        return NextResponse.json({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          tier: newUser.tier,
          brandingColor: null,
          brandingLogoUrl: null,
          parentAgencyId: null,
        });
      } catch {
        // If create fails (race condition), return defaults
        return NextResponse.json({
          tier: 'FREE',
          name: null,
          brandingColor: null,
          brandingLogoUrl: null,
          parentAgencyId: null,
        });
      }
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

// PATCH: Update user profile fields (e.g., brandingColor)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // SECURITY FIX (API-M09): Validate PATCH body with Zod schema
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { brandingColor, brandingLogoUrl, name } = parsed.data;

    // Build update payload with only provided fields
    const updateData: Record<string, string | null> = {};
    if (typeof brandingColor === 'string' || brandingColor === null) {
      updateData.brandingColor = brandingColor;
    }
    if (typeof brandingLogoUrl === 'string' || brandingLogoUrl === null) {
      updateData.brandingLogoUrl = brandingLogoUrl;
    }
    if (typeof name === 'string') {
      updateData.name = name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Upsert: update if exists, create if not (handles first-time branding save)
    const updated = await db.user.upsert({
      where: { id: auth.userId },
      update: updateData,
      create: { id: auth.userId, email: '', tier: 'FREE', ...updateData },
      select: { id: true, brandingColor: true, brandingLogoUrl: true, name: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Auth Profile PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
