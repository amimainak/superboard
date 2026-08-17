// ============================================================
// Superboard — LMS API: Room CRUD
// GET: List rooms | POST: Create room
// Requires x-api-key header
// ============================================================

import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-key'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    // Rate limit: 60 reads per minute per key
    const { allowed } = rateLimit(`v1:rooms:read:${auth.userId}`, 60, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // For API key users, list rooms they have access to.
    // In a full implementation, this would query based on the API key's associated user.
    // For now, we return rooms for the dev user.
    let query = sb
      .from('Room')
      .select('id, tutorId, subject, isActive, startedAt, endedAt, durationMinutes, brandingLogo, brandingColor, createdAt')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status === 'active') query = query.eq('isActive', true)
    else if (status === 'ended') query = query.eq('isActive', false)
    if (subject) query = query.eq('subject', subject.toUpperCase())

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({
      rooms: data || [],
      pagination: {
        limit,
        offset,
        count: data?.length || 0,
      },
    })
  } catch (err: unknown) {
    console.error('[GET /api/v1/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiKey(request)
    if ('response' in auth) return auth.response

    // Rate limit: 20 writes per minute per key
    const { allowed } = rateLimit(`v1:rooms:write:${auth.userId}`, 20, 60_000)
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const supabase = await createClient()

    const body = await request.json()
    const { subject = 'GENERAL', brandingLogo, brandingColor, durationMinutes } = body

    const validSubjects = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH']
    if (!validSubjects.includes(subject)) {
      return NextResponse.json({ error: `Invalid subject. Must be one of: ${validSubjects.join(', ')}` }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    // Create the room under a system/API user, or the key's associated tutor
    // For now, we create under a placeholder. In production, API key maps to a tutor.
    const { data: room, error: roomError } = await sb
      .from('Room')
      .insert({
        tutorId: auth.userId,
        subject,
        brandingLogo: brandingLogo || null,
        brandingColor: brandingColor || null,
        durationMinutes: durationMinutes || 60,
        isActive: true,
        startedAt: new Date().toISOString(),
      })
      .select('id, tutorId, subject, isActive, startedAt, endedAt, durationMinutes, brandingLogo, brandingColor, createdAt')
      .single()

    if (roomError) throw roomError

    // Create initial board page
    await sb.from('BoardPage').insert({
      roomId: room.id,
      pageIndex: 0,
      snapshot: { elements: [], camera: { x: 0, y: 0, zoom: 1 } },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/v1/rooms]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
