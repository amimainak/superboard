// ============================================================
// GET / PUT /api/rooms/[roomId]/notes
// ============================================================
// SECURITY FIX (AUDIT-HIGH-1):
//   - Removed CORS wildcard (was Access-Control-Allow-Origin: *)
//   - Added auth check on both GET and PUT
//   - Uses server Supabase client (cookie-based auth) instead of raw anon client
//   - Validates room participation before read/write
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params

    // --- Verify room access ---
    const hasAccess = await checkRoomAccess(auth.userId, roomId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('session_notes')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      content: data ? data.content : '',
      updatedAt: data ? data.updated_at : null,
    })
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/notes]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params

    // --- Verify room access ---
    const hasAccess = await checkRoomAccess(auth.userId, roomId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    // Validate content type
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    // Limit content size (500KB)
    if (content.length > 500_000) {
      return NextResponse.json({ error: 'Content too large' }, { status: 413 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    // Check if note exists
    const { data: existing } = await (supabase as any)
      .from('session_notes')
      .select('room_id')
      .eq('room_id', roomId)
      .maybeSingle()

    if (existing) {
      const { error } = await (supabase as any)
        .from('session_notes')
        .update({ content, updated_at: now })
        .eq('room_id', roomId)
      if (error) throw error
    } else {
      const { error } = await (supabase as any)
        .from('session_notes')
        .insert({ room_id: roomId, content, updated_at: now })
      if (error) throw error
    }

    return NextResponse.json({ success: true, updatedAt: now })
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/notes]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// --- Helper: verify the caller has access to this room ---
async function checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
  // Check if caller is the room tutor
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { tutorId: true, isActive: true },
  })
  if (!room || !room.isActive) return false
  if (room.tutorId === userId) return true

  // Check if caller is a participant
  const participant = await db.roomParticipant.findUnique({
    where: {
      roomId_studentIdentity: { roomId, studentIdentity: userId },
    },
  })
  if (participant) return true

  // Check if caller is the agency owner of the tutor
  const tutor = await db.user.findUnique({
    where: { id: room.tutorId },
    select: { parentAgencyId: true },
  })
  if (tutor?.parentAgencyId === userId) return true

  return false
}
