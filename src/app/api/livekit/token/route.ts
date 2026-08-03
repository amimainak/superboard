// ============================================================
// API Route: LiveKit Token Generation
// ============================================================
// Generates a LiveKit access token for a given room.
// CHECKS tier limits (video minutes) before granting token.
// Never cuts active calls — only blocks next initiation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkVideoLimit, incrementVideoMinutes } from '@/lib/usage';
import type { Tier } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// TODO: Import livekit-server-sdk when deploying to production
// For now, token generation is architecturally wired.
// In production:
//   import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, userName, isTutor } = body;

    if (!roomId || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, userId, userName' },
        { status: 400 }
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

    // Check video minutes limit (server-side gating)
    const tier = room.tutor.tier as Tier;
    const videoCheck = await checkVideoLimit(userId, tier);

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
    //   canPublish: true,
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
  if (LIVEKIT_API_KEY === '' || LIVEKIT_API_KEY.startsWith('TODO_')) {
    // Return a mock token structure for development
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ sub: userId, name: userName, room: roomId, iss: LIVEKIT_API_KEY, nbf: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64')}.mock_signature`;
  }

  // TODO: Use livekit-server-sdk here in production
  console.warn('[LiveKit] Using placeholder token. Configure LIVEKIT_API_KEY in .env.local');
  return `mock_token_${roomId}_${userId}`;
}
