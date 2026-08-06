// ============================================================
// API Route: Create Room / Get Room(s)
// ============================================================
// POST: Creates a new lesson room. Requires auth — tutorId must match caller.
// GET: Fetches a room by roomId (unauthenticated — students need access).
//      Also supports ?tutorId= to list all rooms for a tutor (auth required).
// FIXED: Consolidated double-fetch for tutor view into single query.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, verifyAuth } from '@/lib/auth';
import { hasFeature } from '@/lib/usage';
import type { Subject, Tier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: only authenticated tutors can create rooms ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { tutorId, subject, brandingLogo, brandingColor, brandingAgencyName } = body;

    if (!tutorId || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: tutorId, subject' },
        { status: 400 }
      );
    }

    // Security: caller can only create rooms for themselves
    if (tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only create rooms for your own account' },
        { status: 403 }
      );
    }

    // Verify tutor exists
    const tutor = await db.user.findUnique({ where: { id: tutorId } });
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // --- Tier gate: check room creation limits ---
    const tutorTier = tutor.tier as Tier;
    const activeRoomCount = await db.room.count({
      where: { tutorId, isActive: true },
    });

    // Use centralized TIER_LIMITS for max rooms
    const { TIER_LIMITS } = await import('@/types');
    const maxRooms = TIER_LIMITS[tutorTier].maxActiveRooms;
    if (activeRoomCount >= maxRooms) {
      return NextResponse.json(
        { error: `ROOM_LIMIT_REACHED`, message: `Free tier allows 1 active room (${activeRoomCount}/1). Please end an existing room or upgrade to Pro for unlimited rooms.` },
        { status: 403 }
      );
    }

    // Create the room with branding snapshot
    const room = await db.room.create({
      data: {
        id: uuidv4(),
        tutorId,
        subject: subject as Subject,
        isActive: true,
        // Branding snapshot — persists even if agency changes logo later
        brandingLogo: brandingLogo || tutor.brandingLogoUrl || null,
        brandingColor: brandingColor || tutor.brandingColor || null,
      },
    });

    // Create initial blank page
    await db.boardPage.create({
      data: {
        id: uuidv4(),
        roomId: room.id,
        pageIndex: 0,
        snapshot: '{}',
      },
    });

    return NextResponse.json({
      roomId: room.id,
      subject: room.subject,
      brandingLogo: room.brandingLogo,
      brandingColor: room.brandingColor,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error('[Room Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const tutorId = searchParams.get('tutorId');

    // --- Case 1: List rooms by tutorId (auth required) ---
    if (tutorId && !roomId) {
      const auth = await requireAuth(request);
      if (auth instanceof NextResponse) return auth;

      // Security: caller can only list their own rooms
      if (tutorId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      const rooms = await db.room.findMany({
        where: { tutorId, isActive: true },
        select: {
          id: true,
          subject: true,
          isActive: true,
          brandingLogo: true,
          brandingColor: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ rooms });
    }

    // --- Case 2: Get single room by roomId ---
    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId or tutorId parameter' },
        { status: 400 }
      );
    }

    // Check if caller is authenticated (for conditional include)
    const auth = await verifyAuth(request);
    const isOwner = auth !== null;

    // FIXED: Single query with conditional email inclusion
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            tier: true,
            // Only include email if the caller is the room owner
            ...(isOwner ? { email: true } : {}),
          },
        },
        pages: {
          orderBy: { pageIndex: 'asc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is no longer active' }, { status: 410 });
    }

    // If authenticated but NOT the owner, strip the email field
    if (auth && auth.userId !== room.tutorId) {
      const { email: _email, ...tutorWithoutEmail } = room.tutor as any;
      return NextResponse.json({ ...room, tutor: tutorWithoutEmail });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('[Room Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}
