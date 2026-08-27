// ============================================================
// API Route: Recording — Start / Stop / List
// ============================================================
// POST: Start a room recording (creates LiveKit Egress).
// DELETE: Stop an active recording.
// GET:  List recordings for a room.
// REQUIRES auth. Only the room tutor can start/stop recordings.
//
// SECURITY FIX (RT-M03): Recording URLs are now served as
// signed, expiring URLs instead of direct storage links.
// Uses HMAC-SHA256 signature with configurable expiry (default 1h).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkRecordingLimit, incrementRecordings } from '@/lib/usage';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

// SECURITY FIX (RT-M03): Signing secret for recording URL tokens
const RECORDING_SIGN_SECRET = process.env.RECORDING_URL_SIGN_SECRET;
if (!RECORDING_SIGN_SECRET) {
  console.error('[Recording] FATAL: RECORDING_URL_SIGN_SECRET environment variable is not set. Recording download links will not work. Set this variable to a persistent random string (e.g., generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")');
}
const RECORDING_URL_EXPIRY_MS = parseInt(process.env.RECORDING_URL_EXPIRY_MS || '3600000', 10); // 1 hour default

/**
 * SECURITY FIX (RT-M03): Generate a signed, expiring URL for a recording.
 * Format: {baseUrl}/api/room/{roomId}/recording/{recordingId}/download?token={signature}&expires={timestamp}
 * The signature covers: recordingId + expires + roomId + secret
 * This prevents unauthorized access to recordings containing student video/voice data (FERPA/COPPA).
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

/**
 * Verify a signed recording URL token.
 * Returns true if the signature is valid and the token has not expired.
 */
export function verifyRecordingToken(
  recordingId: string,
  roomId: string,
  token: string,
  expires: string
): boolean {
  if (!RECORDING_SIGN_SECRET) return false;

  // Check expiry first (fast path)
  const expiresNum = parseInt(expires, 10);
  if (isNaN(expiresNum) || Date.now() > expiresNum) {
    return false;
  }

  // Verify HMAC signature
  const payload = `${recordingId}:${roomId}:${expiresNum}`;
  const expected = crypto
    .createHmac('sha256', RECORDING_SIGN_SECRET)
    .update(payload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'base64url'),
      Buffer.from(expected, 'base64url')
    );
  } catch {
    return false;
  }
}

// POST: Start Recording
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // --- Rate limit check ---
    const rateLimitResult = await checkRateLimit(request, 'livekit');
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } });
    }

    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await params;

    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid roomId format' }, { status: 400 });
    }

    // Verify room exists and caller is the tutor
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { tutor: { select: { id: true, tier: true } } },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    if (room.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — only the room tutor can start recordings' },
        { status: 403 }
      );
    }

    // Check recording quota
    const quotaCheck = await checkRecordingLimit(room.tutorId, room.tutor.tier as any);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'RECORDING_LIMIT_REACHED',
          message: `Monthly recording limit reached (${quotaCheck.recordingsUsed}/${quotaCheck.recordingsLimit}).`,
        },
        { status: 403 }
      );
    }

    // Check if there's already an active recording for this room
    const activeRecording = await db.recording.findFirst({
      where: { roomId, status: 'STARTED' },
    });
    if (activeRecording) {
      return NextResponse.json(
        { error: 'RECORDING_ACTIVE', message: 'A recording is already in progress for this room' },
        { status: 409 }
      );
    }

    // Start LiveKit Egress recording (if LiveKit is configured)
    let egressId: string | null = null;
    let recordingUrl = '';

    if (LIVEKIT_API_KEY && LIVEKIT_URL && !LIVEKIT_API_KEY.startsWith('TODO_')) {
      try {
        const { EgressClient, SegmentedFileProtocol } = await import('livekit-server-sdk');

        const client = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        // LiveKit SDK v2: startRoomCompositeEgress(roomName, output, layout?, options?)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const egress = await (client as any).startRoomCompositeEgress(
          roomId,
          {
            protocol: SegmentedFileProtocol.DEFAULT_SEGMENTED_FILE_PROTOCOL,
            filenamePrefix: `recording-${roomId}`,
          },
          'speaker_top',
          {
            audioOnly: false,
            videoOnly: false,
          }
        );
        egressId = egress.egressId;
        recordingUrl = ''; // URL will be set via webhook when recording completes
      } catch (err) {
        console.error('[Recording Start] LiveKit Egress failed:', err);
        // Continue without LiveKit Egress — store a placeholder recording
      }
    }

    // Create recording entry in database
    const recording = await db.recording.create({
      data: {
        roomId,
        tutorId: auth.userId,
        url: recordingUrl,
        status: egressId ? 'STARTED' : 'STARTED',
        egressId,
        startedAt: new Date(),
      },
    });

    // Increment recording usage
    await incrementRecordings(room.tutorId, room.tutor.tier as any);

    return NextResponse.json({
      recordingId: recording.id,
      status: recording.status,
      egressId: recording.egressId,
      startedAt: recording.startedAt,
    });
  } catch (error) {
    console.error('[Recording Start] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start recording' },
      { status: 500 }
    );
  }
}

// DELETE: Stop Recording
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await params;

    // Find active recording for this room
    const recording = await db.recording.findFirst({
      where: { roomId, status: 'STARTED' },
    });

    if (!recording) {
      return NextResponse.json({ error: 'No active recording found' }, { status: 404 });
    }

    // Only the tutor can stop the recording
    if (recording.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — only the room tutor can stop recordings' },
        { status: 403 }
      );
    }

    // Stop LiveKit Egress if configured
    if (recording.egressId && LIVEKIT_API_KEY && !LIVEKIT_API_KEY.startsWith('TODO_')) {
      try {
        const { EgressClient } = await import('livekit-server-sdk');
        const client = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        await client.stopEgress(recording.egressId);
      } catch (err) {
        console.error('[Recording Stop] LiveKit stop failed:', err);
      }
    }

    // Update recording in database
    const duration = recording.startedAt
      ? Math.round((Date.now() - recording.startedAt.getTime()) / 1000)
      : 0;

    const updated = await db.recording.update({
      where: { id: recording.id },
      data: {
        status: 'STOPPED',
        duration,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      recordingId: updated.id,
      status: updated.status,
      duration: updated.duration,
    });
  } catch (error) {
    console.error('[Recording Stop] Error:', error);
    return NextResponse.json(
      { error: 'Failed to stop recording' },
      { status: 500 }
    );
  }
}

// GET: List Recordings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await params;

    // Verify room exists
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only the tutor or a participant can list recordings
    if (room.tutorId !== auth.userId) {
      const isParticipant = await db.roomParticipant.findUnique({
        where: { roomId_studentIdentity: { roomId, studentIdentity: auth.userId } },
      });
      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const recordings = await db.recording.findMany({
      where: { roomId },
      select: {
        id: true,
        url: true,
        status: true,
        duration: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // SECURITY FIX (RT-M03): Replace direct URLs with signed, expiring URLs
    // Recordings contain student video/voice data (FERPA/COPPA protected).
    // Direct URLs would allow anyone with the link to download indefinitely.
    const recordingsWithSignedUrls = recordings.map((rec) => {
      if (rec.url && rec.status === 'STOPPED') {
        return {
          ...rec,
          url: signRecordingUrl(rec.id, roomId),
          urlExpiresAt: new Date(Date.now() + RECORDING_URL_EXPIRY_MS).toISOString(),
        };
      }
      return { ...rec, url: null, urlExpiresAt: null };
    });

    return NextResponse.json({ recordings: recordingsWithSignedUrls });
  } catch (error) {
    console.error('[Recording List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list recordings' },
      { status: 500 }
    );
  }
}
