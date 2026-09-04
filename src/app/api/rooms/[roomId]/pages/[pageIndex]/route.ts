import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { upsertPageSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId, pageIndex } = await params
    const pageIndexNum = parseInt(pageIndex)
    if (isNaN(pageIndexNum) || pageIndexNum < 0) return NextResponse.json({ error: 'Invalid page index' }, { status: 400 })

    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const page = await db.boardPage.findUnique({
      where: { roomId_pageIndex: { roomId, pageIndex: pageIndexNum } },
    })
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    return NextResponse.json(page)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/pages/[pageIndex]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId, pageIndex } = await params
    const pageIndexNum = parseInt(pageIndex)
    if (isNaN(pageIndexNum) || pageIndexNum < 0) return NextResponse.json({ error: 'Invalid page index' }, { status: 400 })

    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = upsertPageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    const { snapshot } = parsed.data
    const snapshotData = snapshot as unknown as object
    const page = await db.boardPage.upsert({
      where: { roomId_pageIndex: { roomId, pageIndex: pageIndexNum } },
      create: { roomId, pageIndex: pageIndexNum, snapshot: snapshotData },
      update: { snapshot: snapshotData },
    })
    return NextResponse.json(page)
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/pages/[pageIndex]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
