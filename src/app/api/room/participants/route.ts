// ============================================================
// API Route: Room Participants
// ============================================================
// POST: Student joins a room (upsert by roomId + studentIdentity).
//       No auth required — students can be anonymous.
// GET:  List participants in a room. No auth required.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, studentIdentity, studentName } = body;

    if (!roomId || !studentIdentity) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, studentIdentity' },
        { status: 400 }
      );
    }

    // Validate room exists and is active
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, isActive: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room is no longer active' },
        { status: 410 }
      );
    }

    // Upsert: if (roomId, studentIdentity) combo exists, update lastActiveAt;
    // otherwise create a new participant row.
    const participant = await db.roomParticipant.upsert({
      where: {
        roomId_studentIdentity: { roomId, studentIdentity },
      },
      update: {
        lastActiveAt: new Date(),
        ...(studentName ? { studentName } : {}),
      },
      create: {
        roomId,
        studentIdentity,
        studentName: studentName || null,
      },
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
    });
  } catch (error) {
    console.error('[Room Participants Join] Error:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
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
        { error: 'Missing required parameter: roomId' },
        { status: 400 }
      );
    }

    // Validate room exists
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const participants = await db.roomParticipant.findMany({
      where: { roomId },
      select: {
        id: true,
        studentIdentity: true,
        studentName: true,
        joinedAt: true,
        lastActiveAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('[Room Participants List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
