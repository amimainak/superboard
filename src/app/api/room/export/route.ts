// ============================================================
// API Route: Session Export (Post-Session PDF)
// ============================================================
// GET: Export a session's canvas pages as a JSON snapshot
//       that the frontend can render to PDF.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // --- Security: Verify caller owns the room or is a participant ---
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if caller is the room tutor
    const isOwner = auth.userId === room.tutorId;

    // Check if caller is a participant
    const isParticipant = !isOwner && await db.roomParticipant.findUnique({
      where: { roomId_studentIdentity: { roomId, studentIdentity: auth.userId } },
    }).then((p) => !!p);

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden — you do not have access to this room' }, { status: 403 });
    }

    // Fetch all pages for the room
    const pages = await db.boardPage.findMany({
      where: { roomId },
      orderBy: { pageIndex: 'asc' },
      select: {
        id: true,
        pageIndex: true,
        snapshot: true,
        createdAt: true,
      },
    });

    // Fetch room metadata
    const roomFull = await db.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        tutor: { select: { name: true, email: true } },
      },
    });

    if (!roomFull) {
      return NextResponse.json({ error: 'Room metadata not found' }, { status: 500 });
    }

    return NextResponse.json({
      room: {
        id: roomFull.id,
        subject: roomFull.subject,
        createdAt: roomFull.createdAt,
        tutorName: roomFull.tutor?.name,
        // Only include email for the room owner
        ...(isOwner ? { tutorEmail: roomFull.tutor?.email } : {}),
      },
      pages: pages.map((p) => ({
        id: p.id,
        pageIndex: p.pageIndex,
        snapshot: p.snapshot,
      })),
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Session Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
