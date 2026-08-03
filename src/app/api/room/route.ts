// ============================================================
// API Route: Create Room
// ============================================================
// Creates a new lesson room. Generates Room ID.
// Captures branding snapshot from tutor's agency config.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Subject } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tutorId, subject, brandingLogo, brandingColor, brandingAgencyName } = body;

    if (!tutorId || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: tutorId, subject' },
        { status: 400 }
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

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId parameter' },
        { status: 400 }
      );
    }

    const room = await db.room.findUnique({
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

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is no longer active' }, { status: 410 });
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
