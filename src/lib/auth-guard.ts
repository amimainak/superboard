import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface AuthUser {
  id: string
  email: string | null
  role: string // 'authenticated' | 'anon'
}

/**
 * Reusable auth guard for API routes.
 * Returns the authenticated user or a 401 response — never both.
 *
 * Usage:
 *   const { user, response } = await getAuthenticatedUser()
 *   if (response) return response   // 401 Unauthorized
 *   // ... user is guaranteed to be non-null here
 */
export async function getAuthenticatedUser(): Promise<{
  user: AuthUser | null
  response: NextResponse | null
}> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can't set cookies
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    user: { id: user.id, email: user.email ?? null, role: (user.role as string) || 'authenticated' },
    response: null,
  }
}
