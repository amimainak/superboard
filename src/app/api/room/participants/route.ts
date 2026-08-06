// ============================================================
// API Route: Room Participants
// ============================================================
// POST: Student joins a room (upsert by roomId + studentIdentity).
//       Validates input lengths and formats.
// GET:  List participants in a room. Requires authentication.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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

    // Input validation: prevent abuse via oversized strings
    if (typeof roomId !== 'string' || roomId.length > 100) {
      return NextResponse.json(
        { error: 'Invalid roomId format or length' },
        { status: 400 }
      );
    }
    if (typeof studentIdentity !== 'string' || studentIdentity.length > 200) {
      return NextResponse.json(
        { error: 'Invalid studentIdentity format or length' },
        { status: 400 }
      );
    }
    if (studentName && (typeof studentName !== 'string' || studentName.length > 200)) {
      return NextResponse.json(
        { error: 'Invalid studentName format or length' },
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
    // --- Auth check: require authentication to list participants ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

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
      select: { id: true, tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Security: only the room tutor (or their agency) can list participants
    if (room.tutorId !== auth.userId) {
      // Check if caller is the agency owner of the tutor
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      if (!caller || caller.tier !== 'AGENCY') {
        return NextResponse.json(
          { error: 'Forbidden — only the room tutor can list participants' },
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
          { error: 'Forbidden — only the room tutor can list participants' },
          { status: 403 }
        );
      }
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
