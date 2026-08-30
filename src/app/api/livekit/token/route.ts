import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { parseBody, livekitTokenSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { db } from '@/lib/db'

// POST /api/livekit/token — generate LiveKit join token
export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    // Rate limit: 5 token requests per minute per user
    const { allowed, retryAfterMs } = rateLimit(`livekit:${user!.id}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limited', retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const LIVEKIT_URL = process.env.LIVEKIT_URL
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: 'LiveKit is not configured. VPS setup required.' },
        { status: 503 }
      )
    }

    const raw = await request.json()
    const { data, error } = parseBody(livekitTokenSchema, raw)
    if (error || !data) {
      return NextResponse.json({ error: error || 'Invalid request' }, { status: 400 })
    }
    const { roomName, participantName, metadata } = data

    // CRITICAL: Verify user has access to this room
    const room = await db.room.findUnique({
      where: { id: roomName },
      select: { tutorId: true },
    })
    const isTutor = room && room.tutorId === user!.id
    let canPublish = false
    if (isTutor) {
      canPublish = true
    } else {
      // Check if user is a participant in this room
      const participant = await db.roomParticipant.findFirst({
        where: { roomId: roomName, userId: user!.id },
      })
      if (!participant) {
        return NextResponse.json({ error: 'You do not have access to this room' }, { status: 403 })
      }
    }

    // Force participantIdentity to the authenticated user's ID
    const participantIdentity = user!.id

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      metadata: metadata || '',
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
      // No recording
      canPublishData: true,
    })

    const jwt = await token.toJwt()
    return NextResponse.json({
      token: jwt,
      url: LIVEKIT_URL,
    })
  } catch (err: unknown) {
    console.error('[POST /api/livekit/token]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
