import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { parseBody, livekitTokenSchema } from '@/lib/validations'

// POST /api/livekit/token — generate LiveKit join token
export async function POST(request: Request) {
  try {
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
    const { roomName, participantName, participantIdentity, metadata } = data

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity || participantName.replace(/\s+/g, '-').toLowerCase(),
      name: participantName,
      metadata: metadata || '',
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
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
    const message = err instanceof Error ? err.message : 'Failed to generate token'
    console.error('[LiveKit Token]', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
