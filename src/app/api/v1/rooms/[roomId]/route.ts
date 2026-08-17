// ============================================================
// Superboard — LMS API: Room Detail
// GET: Get room details | PATCH: Update room
// Requires x-api-key header
// ============================================================

import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-key'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireApiKey(_request)
    if ('response' in auth) return auth.response

    // Rate limit
    const { allowed } = rateLimit(`v1:room:read:${auth.userId}`, 60, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const { roomId } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room, error } = await (supabase as any)
      .from('Room')
      .select('id, tutorId, subject, isActive, startedAt, endedAt, durationMinutes, brandingLogo, brandingColor, createdAt')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get page count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: pageCount } = await (supabase as any)
      .from('BoardPage')
      .select('id', { count: 'exact', head: true })
      .eq('roomId', roomId)

    return NextResponse.json({
      ...room,
      pageCount: pageCount || 0,
      whiteboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://superboard.app'}/room/${roomId}`,
    })
  } catch (err: unknown) {
    console.error('[GET /api/v1/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    // Rate limit
    const { allowed } = rateLimit(`v1:room:write:${auth.userId}`, 20, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const { roomId } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Build updates object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {}

    if (body.subject !== undefined) {
      const validSubjects = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH']
      if (!validSubjects.includes(body.subject)) {
        return NextResponse.json({ error: `Invalid subject: ${body.subject}` }, { status: 400 })
      }
      updates.subject = body.subject
    }

    if (body.isActive !== undefined) {
      updates.isActive = body.isActive
      if (body.isActive === false && !body.endedAt) {
        updates.endedAt = new Date().toISOString()
      }
    }

    if (body.durationMinutes !== undefined) {
      const mins = Number(body.durationMinutes)
      if (!Number.isInteger(mins) || mins < 0 || mins > 480) {
        return NextResponse.json({ error: 'durationMinutes must be an integer between 0 and 480' }, { status: 400 })
      }
      updates.durationMinutes = mins
    }

    if (body.brandingColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(body.brandingColor)) {
        return NextResponse.json({ error: 'brandingColor must be a hex color like #ff0000' }, { status: 400 })
      }
      updates.brandingColor = body.brandingColor
    }

    if (body.brandingLogo !== undefined) {
      updates.brandingLogo = body.brandingLogo
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room, error } = await (supabase as any)
      .from('Room')
      .update(updates)
      .eq('id', roomId)
      .select('id, tutorId, subject, isActive, startedAt, endedAt, durationMinutes, brandingLogo, brandingColor, createdAt')
      .single()

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (err: unknown) {
    console.error('[PATCH /api/v1/rooms/[roomId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
