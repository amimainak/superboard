import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Graceful degradation: if Supabase env vars are missing, skip auth
  // but still set security headers so the app at least loads.
  if (!supabaseUrl || !supabaseKey) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), display-capture=()')
    // SECURITY FIX (AUDIT-MED-4): Add HSTS header
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    return response
  }

  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route
  )
  const isRoomRoute = request.nextUrl.pathname.startsWith('/room/')

  if (!user && !isPublicRoute && !isRoomRoute) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(self), display-capture=()')
  // SECURITY FIX (AUDIT-MED-4): Add HSTS header
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return supabaseResponse
}
