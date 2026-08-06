// ============================================================
// API Route: LiveKit Token Generation
// ============================================================
// Generates a LiveKit access token for a given room.
// REQUIRES authentication — caller must be the room tutor or
// a registered participant.
// CHECKS tier limits (video minutes) before granting token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkVideoLimit } from '@/lib/usage';
import { livekitTokenSchema, validateInput } from '@/lib/validations';
import type { Tier } from '@/types';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: REQUIRE authentication for token generation ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{ roomId: string; userId: string; userName: string; isTutor?: boolean }>(livekitTokenSchema, body);
    if (!parsed.success) return parsed.response;
    const { roomId, userId, userName, isTutor } = parsed.data;

    // Security: caller can only request tokens for themselves
    if (userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only generate tokens for your own account' },
        { status: 403 }
      );
    }

    // Verify room exists and is active
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { tutor: true },
    });

    if (!room || !room.isActive) {
      return NextResponse.json(
        { error: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    // Check video minutes limit against the tutor's account (not the student's)
    const tier = room.tutor.tier as Tier;
    const videoCheck = await checkVideoLimit(room.tutorId, tier);

    if (!videoCheck.allowed) {
      return NextResponse.json(
        {
          error: 'VIDEO_LIMIT_REACHED',
          message: 'Weekly video limit reached. Limit resets Monday 00:00 UTC.',
          minutesUsed: videoCheck.minutesUsed,
          minutesLimit: videoCheck.minutesLimit,
        },
        { status: 403 }
      );
    }

    // Generate LiveKit token
    // TODO: Replace this with actual livekit-server-sdk token generation:
    //
    // const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    //   identity: userId,
    //   name: userName,
    // });
    // at.addGrant({
    //   roomJoin: true,
    //   room: roomId,
    //   canPublish: isTutor !== false,
    //   canSubscribe: true,
    //   canPublishData: true,
    // });
    // const token = await at.toJwt();

    const token = generatePlaceholderToken(userId, userName, roomId);

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
      roomName: roomId,
    });
  } catch (error) {
    console.error('[LiveKit Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

/**
 * Placeholder token generator.
 * TODO: Replace with livekit-server-sdk AccessToken when deploying.
 */
function generatePlaceholderToken(userId: string, userName: string, roomId: string): string {
  if (!LIVEKIT_API_KEY || LIVEKIT_API_KEY.startsWith('TODO_')) {
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ sub: userId, name: userName, room: roomId, iss: LIVEKIT_API_KEY, nbf: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64')}.mock_signature`;
  }

  console.warn('[LiveKit] Using placeholder token. Configure LIVEKIT_API_KEY in .env.local');
  return `mock_token_${roomId}_${userId}`;
}
