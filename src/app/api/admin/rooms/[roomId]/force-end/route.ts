// ============================================================
// Admin API — Force End Room Session
// ============================================================
// POST — Marks room as inactive and logs the action
// In a full implementation, this would also broadcast a
// WebSocket termination signal to all connected clients.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { roomId } = await params;

  try {
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, isActive: true, tutor: { select: { email: true } } },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is already closed.' }, { status: 400 });
    }

    // Close the room
    await db.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    await logAudit(adminCheck.userId, 'ROOM_FORCE_END', 'Room', roomId, {
      tutorEmail: room.tutor?.email,
      reason: 'Admin force-ended session',
    });

    // Note: In production, you would also broadcast via Hocuspocus/Yjs
    // to disconnect all clients from this room's collaboration channel.

    return NextResponse.json({
      success: true,
      message: 'Room session force-ended. All participants should be disconnected.',
    });
  } catch (error: any) {
    console.error('[Admin Force End]', error);
    return NextResponse.json({ error: 'Failed to force-end room.' }, { status: 500 });
  }
}
