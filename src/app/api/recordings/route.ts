// ============================================================
// API Route: Batch Recordings
// ============================================================
// GET: Fetch all recordings for rooms where the authenticated user
//      is the tutor OR a participant, in a single query.
//      Eliminates N+1 API calls from RecordingsPanel.
//      Returns signed URLs for completed recordings (RT-M03).
// ============================================================
//
// NOTE: The Recording Prisma model exposes: roomId, tutorId,
// startedAt, endedAt, durationSec, status, storageUrl,
// thumbnailUrl. There is no `url`, `duration`, or `egressId`
// column. Status uses lowercase values ('recording' | 'processing'
// | 'ready' | 'failed' | 'deleted'); a 'ready' recording is the
// equivalent of the legacy 'STOPPED' state.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

// SECURITY FIX (RT-M03): Signing secret for recording URL tokens
const RECORDING_SIGN_SECRET = process.env.RECORDING_URL_SIGN_SECRET;
const RECORDING_URL_EXPIRY_MS = parseInt(process.env.RECORDING_URL_EXPIRY_MS || '3600000', 10);

/**
 * Generate a signed, expiring URL for a recording (same pattern as
 * /api/room/[roomId]/recording/route.ts).
 */
function signRecordingUrl(recordingId: string, roomId: string): string {
  if (!RECORDING_SIGN_SECRET) return '';
  const expires = Date.now() + RECORDING_URL_EXPIRY_MS;
  const payload = `${recordingId}:${roomId}:${expires}`;
  const signature = crypto
    .createHmac('sha256', RECORDING_SIGN_SECRET)
    .update(payload)
    .digest('base64url');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/api/room/${roomId}/recording/${recordingId}/download?token=${signature}&expires=${expires}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Query recordings for rooms where user is the tutor
    const tutorRecordings = await db.recording.findMany({
      where: { tutorId: auth.userId },
      select: {
        id: true,
        roomId: true,
        storageUrl: true,
        status: true,
        durationSec: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        room: {
          select: {
            subject: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Query recordings for rooms where user is a participant
    const participantRoomIds = await db.roomParticipant.findMany({
      where: { studentIdentity: auth.userId },
      select: { roomId: true },
      distinct: ['roomId'],
    });

    const pRoomIds = participantRoomIds.map((r) => r.roomId);
    let participantRecordings: typeof tutorRecordings = [];
    if (pRoomIds.length > 0) {
      participantRecordings = await db.recording.findMany({
        where: { roomId: { in: pRoomIds } },
        select: {
          id: true,
          roomId: true,
          storageUrl: true,
          status: true,
          durationSec: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
          room: {
            select: {
              subject: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Merge and deduplicate by recording id
    const seen = new Set<string>();
    const allRecordings: typeof tutorRecordings = [];
    for (const rec of [...tutorRecordings, ...participantRecordings]) {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        allRecordings.push(rec);
      }
    }

    // Sort by createdAt desc (merge may have disrupted order)
    allRecordings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // SECURITY FIX (RT-M03): Return signed URLs for completed recordings.
    // A recording is "completed" when its status is 'ready' (the schema's
    // equivalent of the legacy 'STOPPED' state).
    const recordingsWithSignedUrls = allRecordings.map((rec) => {
      if (rec.storageUrl && rec.status === 'ready') {
        return {
          id: rec.id,
          roomId: rec.roomId,
          url: signRecordingUrl(rec.id, rec.roomId),
          status: rec.status,
          duration: rec.durationSec,
          startedAt: rec.startedAt,
          endedAt: rec.endedAt,
          createdAt: rec.createdAt,
          roomSubject: rec.room.subject,
          roomCreatedAt: rec.room.createdAt.toISOString(),
        };
      }
      return {
        id: rec.id,
        roomId: rec.roomId,
        url: null,
        status: rec.status,
        duration: rec.durationSec,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        createdAt: rec.createdAt,
        roomSubject: rec.room.subject,
        roomCreatedAt: rec.room.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ recordings: recordingsWithSignedUrls });
  } catch (error) {
    console.error('[Recordings Batch] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}
