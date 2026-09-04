import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { savePagesSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId } = await params
    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const pages = await db.boardPage.findMany({
      where: { roomId },
      orderBy: { pageIndex: 'asc' },
    })
    return NextResponse.json(pages)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/pages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId } = await params
    const room = await db.room.findUnique({ where: { id: roomId }, select: { tutorId: true } })
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = savePagesSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    const pages = parsed.data.pages
    if (pages && pages.length > 0) {
      for (const p of pages) {
        await db.boardPage.upsert({
          where: { roomId_pageIndex: { roomId, pageIndex: p.pageIndex } },
          create: { roomId, pageIndex: p.pageIndex, snapshot: p.snapshot as unknown as object },
          update: { snapshot: p.snapshot as unknown as object },
        })
      }
    }

    return NextResponse.json({ success: true, count: pages?.length || 0 })
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/pages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
