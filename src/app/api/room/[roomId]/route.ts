// ============================================================
// API Route: PATCH /api/room/[roomId] — End Lesson
// ============================================================
// Sets isActive=false on a room. Only the room owner (tutor) can end it.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await params;

    // Validate roomId format
    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid roomId format' }, { status: 400 });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, tutorId: true, isActive: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only the room owner can end the lesson
    if (room.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — only the room owner can end this lesson' },
        { status: 403 }
      );
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is already ended' }, { status: 409 });
    }

    await db.room.update({
      where: { id: roomId },
      data: { isActive: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error('[Room End] Error:', error);
    return NextResponse.json(
      { error: 'Failed to end room' },
      { status: 500 }
    );
  }
}
