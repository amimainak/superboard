// ============================================================
// API Route: Create Room / Get Room(s)
// ============================================================
// POST: Creates a new lesson room. Requires auth — tutorId must match caller.
// GET: Fetches a room by roomId (unauthenticated — students need access).
//      Also supports ?tutorId= to list all rooms for a tutor (auth required).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '@/lib/auth';
import type { Subject } from '@/types';

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

    // --- Case 2: Get single room by roomId (open — students need access) ---
    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId or tutorId parameter' },
        { status: 400 }
      );
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        tutor: {
          select: { id: true, name: true, tier: true },
          // Intentionally exclude email from student-facing responses
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

    // If the caller is the tutor, include email
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // We have a token — check if it's the room owner
      const { requireAuth } = await import('@/lib/auth');
      const auth = await requireAuth(request);
      if (!(auth instanceof NextResponse) && auth.userId === room.tutorId) {
        // Re-fetch with email included for the tutor
        const roomWithEmail = await db.room.findUnique({
          where: { id: roomId },
          include: {
            tutor: {
              select: { id: true, name: true, email: true, tier: true },
            },
            pages: {
              orderBy: { pageIndex: 'asc' },
            },
          },
        });
        return NextResponse.json(roomWithEmail);
      }
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
