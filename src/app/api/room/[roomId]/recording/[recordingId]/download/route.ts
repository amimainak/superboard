// ============================================================
// API Route: Recording Download — Signed URL Verification
// ============================================================
// GET: Downloads a recording file after verifying the signed
// URL token. This endpoint validates the HMAC-SHA256 signature
// and expiry timestamp before serving the recording.
//
// SECURITY FIX (RT-M03): This endpoint prevents unauthorized
// access to recordings containing student PII (video/voice).
// Recordings are FERPA/COPPA protected educational records.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const RECORDING_SIGN_SECRET = process.env.RECORDING_URL_SIGN_SECRET || '';

/**
 * Verify a signed recording URL token.
 * Returns true if the signature is valid and the token has not expired.
 */
function verifyRecordingToken(
  recordingId: string,
  roomId: string,
  token: string,
  expires: string
): boolean {
  if (!RECORDING_SIGN_SECRET) {
    console.error('[Recording Download] RECORDING_URL_SIGN_SECRET not configured');
    return false;
  }

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; recordingId: string }> }
) {
  try {
    const { roomId, recordingId } = await params;

    // Extract and validate token parameters
    const token = request.nextUrl.searchParams.get('token');
    const expires = request.nextUrl.searchParams.get('expires');

    if (!token || !expires) {
      return NextResponse.json(
        { error: 'Missing required parameters: token and expires' },
        { status: 400 }
      );
    }

    // SECURITY FIX (RT-M03): Verify signed token
    if (!verifyRecordingToken(recordingId, roomId, token, expires)) {
      return NextResponse.json(
        { error: 'Invalid or expired recording access token' },
        { status: 403 }
      );
    }

    // Validate roomId format
    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid roomId format' }, { status: 400 });
    }

    // Validate recordingId format
    if (!recordingId || !/^[a-zA-Z0-9-]{1,100}$/.test(recordingId)) {
      return NextResponse.json({ error: 'Invalid recordingId format' }, { status: 400 });
    }

    // Look up the recording
    const recording = await db.recording.findUnique({
      where: { id: recordingId },
      select: {
        id: true,
        url: true,
        status: true,
        roomId: true,
      },
    });

    if (!recording || recording.roomId !== roomId) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    if (recording.status !== 'STOPPED') {
      return NextResponse.json(
        { error: 'Recording is not yet available' },
        { status: 409 }
      );
    }

    if (!recording.url) {
      return NextResponse.json(
        { error: 'Recording file not available' },
        { status: 404 }
      );
    }

    // SECURITY: Log access for audit trail (FERPA compliance)
    const clientIP = request.headers.get('x-real-ip') || 'unknown';
    console.log(
      `[Recording Download] Recording ${recordingId} accessed from IP: ${clientIP}`
    );

    // Redirect to the actual storage URL
    return NextResponse.redirect(recording.url);
  } catch (error) {
    console.error('[Recording Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to access recording' },
      { status: 500 }
    );
  }
}
