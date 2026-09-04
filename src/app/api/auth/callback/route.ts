import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const SAFE_REDIRECT_RE = /^\/[a-zA-Z0-9._~:/?#@!$&'()*+,;=%-]*$/

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = SAFE_REDIRECT_RE.test(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Auto-create or update User record
        await db.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email ?? '',
            name: user.user_metadata?.name || null,
            tier: 'FREE',
            isAdmin: false,
          },
          update: {
            email: user.email ?? '',
            name: user.user_metadata?.name || null,
          },
        })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
