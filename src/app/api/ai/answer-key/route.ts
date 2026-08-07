// ============================================================
// API Route: AI Answer Key Verification
// ============================================================
// Verifies that the caller is a tutor before allowing access
// to answer key data. This endpoint should be called before
// displaying answer keys to ensure server-side authorization.
//
// POST body: { roomId: string }
// Returns: { verified: true } if the caller is the room tutor
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const answerKeyVerifySchema = z.object({
  roomId: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: require authentication ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = answerKeyVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid roomId' },
        { status: 400 }
      );
    }

    const { roomId } = parsed.data;

    // Verify the caller is the tutor for this room
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { tutorId: true, isActive: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room is no longer active' },
        { status: 410 }
      );
    }

    // Check if caller is the room tutor or their agency
    if (room.tutorId !== auth.userId) {
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      if (!caller || caller.tier !== 'AGENCY') {
        return NextResponse.json(
          { error: 'Forbidden — only the room tutor can access answer keys' },
          { status: 403 }
        );
      }
      // Check if the tutor is a sub-tutor under this agency
      const tutor = await db.user.findUnique({
        where: { id: room.tutorId },
        select: { parentAgencyId: true },
      });
      if (!tutor || tutor.parentAgencyId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden — only the room tutor can access answer keys' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
