import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// A-11: Only allow relative paths starting with a single /.
// Reject protocol-relative (//), absolute URLs, backslashes, and encoded tricks.
const SAFE_REDIRECT_RE = /^\/[a-zA-Z0-9._~:/?#@!$&'()*+,;=%-]*$/

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // A-11: Validate redirect — must be a safe relative path
  const next = SAFE_REDIRECT_RE.test(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Auto-create User record if it doesn't exist (new signup)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any
        // Only set isAdmin: false on create — never reset it on update
        const { data: existingUser } = await sb.from('User').select('id').eq('id', user.id).single()
        if (existingUser) {
          await sb.from('User').update({
            email: user.email ?? '',
            name: user.user_metadata?.name || null,
            tier: 'FREE',
          }).eq('id', user.id)
        } else {
          await sb.from('User').insert({
            id: user.id,
            email: user.email ?? '',
            name: user.user_metadata?.name || null,
            tier: 'FREE',
            isAdmin: false,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
