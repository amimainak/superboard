// ============================================================
// API Route: Create Room / Get Room(s)
// ============================================================
// POST: Creates a new lesson room. Requires auth — tutorId must match caller.
// GET: Fetches a room by roomId.
//      SECURITY FIX (V-06): All GET requests now require authentication.
//      Students who need access should use their authenticated session.
//      Also supports ?tutorId= to list all rooms for a tutor (auth required).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, verifyAuth } from '@/lib/auth';
import { hasFeature } from '@/lib/usage';
import { createRoomSchema, validateInput } from '@/lib/validations';
import { isAgencyTier, type Subject, Tier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: only authenticated tutors can create rooms ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{ tutorId: string; subject: string; brandingLogo?: string | null; brandingColor?: string | null }>(createRoomSchema, body);
    if (!parsed.success) return parsed.response;
    const { tutorId, subject, brandingLogo, brandingColor } = parsed.data;

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
    // SECURITY FIX (V-06): Require authentication for ALL GET requests.
    // Previously, single-room GET used verifyAuth (optional), exposing
    // room data (including tutor email) to unauthenticated users.
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const tutorId = searchParams.get('tutorId');

    // --- Case 1: List rooms by tutorId ---
    if (tutorId && !roomId) {
      // Security: caller can only list their own rooms
      if (tutorId !== auth.userId) {
        // Allow agency owners to list sub-tutor rooms
        const caller = await db.user.findUnique({
          where: { id: auth.userId },
          select: { tier: true },
        });
        if (!caller || !isAgencyTier(caller.tier)) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
        // Verify the tutor is a sub-tutor under this agency
        const tutor = await db.user.findUnique({
          where: { id: tutorId },
          select: { parentAgencyId: true },
        });
        if (!tutor || tutor.parentAgencyId !== auth.userId) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
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

    const isOwner = auth.userId;

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            tier: true,
            email: true,
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

    // SECURITY (V-06): Strip tutor email from non-owners
    if (auth.userId !== room.tutorId) {
      // Check if caller is a participant in this room
      const isParticipant = await db.roomParticipant.findUnique({
        where: {
          roomId_studentIdentity: { roomId, studentIdentity: auth.userId },
        },
      });

      // Allow agency owners to view sub-tutor rooms
      let isAgencyOwner = false;
      if (!isParticipant) {
        const caller = await db.user.findUnique({
          where: { id: auth.userId },
          select: { tier: true },
        });
        if (caller && isAgencyTier(caller.tier)) {
          const tutor = await db.user.findUnique({
            where: { id: room.tutorId },
            select: { parentAgencyId: true },
          });
          isAgencyOwner = tutor?.parentAgencyId === auth.userId;
        }
      }

      if (!isParticipant && !isAgencyOwner) {
        return NextResponse.json(
          { error: 'Forbidden — you do not have access to this room' },
          { status: 403 }
        );
      }

      // Strip sensitive tutor info for non-owners
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
