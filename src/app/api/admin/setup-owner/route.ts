import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@superboard.app'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed } = rateLimit('setup-owner:' + ip, 5, 60000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const secret = process.env.SETUP_SECRET
  if (!secret) return NextResponse.json({ error: 'SETUP_SECRET not configured' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const providedSecret = (body as { secret?: string }).secret
  if (!providedSecret || providedSecret.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(providedSecret), Buffer.from(secret))) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingAuth = listData?.users?.find(u => u.email === OWNER_EMAIL)

    let userId: string
    let isNewUser = false

    if (existingAuth) {
      userId = existingAuth.id
    } else {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      const password = Array.from(crypto.randomBytes(20)).map((b: number) => chars[b % chars.length]).join('')
      const { data, error } = await supabase.auth.admin.createUser({
        email: OWNER_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { name: 'Superboard Owner' },
      })
      if (error) return NextResponse.json({ error: 'Failed to create auth user: ' + error.message }, { status: 500 })
      userId = data.user.id
      isNewUser = true
    }

    // Upsert User record with Prisma
    await db.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: OWNER_EMAIL,
        name: 'Superboard Owner',
        tier: 'AGENCY',
        isAdmin: true,
      },
      update: {
        email: OWNER_EMAIL,
        name: 'Superboard Owner',
        tier: 'AGENCY',
        isAdmin: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Owner account configured', isNewUser })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Setup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
