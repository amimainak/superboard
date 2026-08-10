// ============================================================
// API Route: Video Heartbeat
// ============================================================
// Receives periodic heartbeats from active video sessions.
// Increments videoMinutesUsed in the UsageLog.
// Called every 60 seconds by the client while video is active.
//
// POST body: { seconds: number } — seconds elapsed since last heartbeat
// Response: { ok: true, videoMinutesUsed: number, videoMinutesLimit: number }
//
// If the user has exceeded their video limit, returns 403 with
// VIDEO_LIMIT_REACHED to signal the client to show the paywall.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { incrementVideoMinutes, checkVideoLimit } from '@/lib/usage';
import type { Tier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Parse body
    let body: { seconds?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const seconds = typeof body.seconds === 'number' ? Math.min(body.seconds, 300) : 60;
    const minutesToAdd = seconds / 60;

    // Get the room ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const roomIdIndex = pathParts.indexOf('room') + 1;
    const roomId = pathParts[roomIdIndex];

    if (!roomId) {
      return NextResponse.json({ error: 'Missing room ID' }, { status: 400 });
    }

    // Verify the room exists and is active
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { tutor: true },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // SECURITY FIX (API-H06): Verify caller is room tutor or participant
    if (room.tutorId !== auth.userId) {
      const isParticipant = await db.roomParticipant.findUnique({
        where: { roomId_studentIdentity: { roomId, studentIdentity: auth.userId } },
      });
      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden — you are not in this room' }, { status: 403 });
      }
    }

    // Check video limit against the tutor's account
    const tier = room.tutor.tier as Tier;
    const videoCheck = await checkVideoLimit(room.tutorId, tier);

    // If limit already exceeded, block
    if (!videoCheck.allowed && videoCheck.minutesUsed >= videoCheck.minutesLimit) {
      return NextResponse.json(
        {
          error: 'VIDEO_LIMIT_REACHED',
          message: 'Video limit reached. Upgrade to continue.',
          videoMinutesUsed: videoCheck.minutesUsed,
          videoMinutesLimit: videoCheck.minutesLimit,
        },
        { status: 403 }
      );
    }

    // Increment video minutes (tutor's usage log)
    await incrementVideoMinutes(room.tutorId, minutesToAdd, tier);

    // Get updated usage for response
    const updatedCheck = await checkVideoLimit(room.tutorId, tier);

    // Update room duration tracking
    if (room.startedAt) {
      const elapsed = Math.floor((Date.now() - room.startedAt.getTime()) / 60000);
      await db.room.update({
        where: { id: roomId },
        data: { durationMinutes: elapsed },
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      videoMinutesUsed: Math.ceil(updatedCheck.minutesUsed),
      videoMinutesLimit: updatedCheck.minutesLimit,
      approachingLimit: updatedCheck.minutesLimit !== Infinity &&
        updatedCheck.minutesUsed >= updatedCheck.minutesLimit * 0.8,
    });
  } catch (error) {
    console.error('[Video Heartbeat] Error:', error);
    return NextResponse.json(
      { error: 'Heartbeat processing failed' },
      { status: 500 }
    );
  }
}
