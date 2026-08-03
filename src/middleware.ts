// ============================================================
// Next.js Middleware — Custom Domain Routing
// ============================================================
// Intercepts incoming requests. If hostname is NOT the main app
// domain (e.g., is classroom.smith.com), queries User table for
// customDomain. If found, passes branding data downstream.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// TODO: In production, this queries the database.
// For architecture wiring, we define the logic and use env vars.
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Remove port if present (e.g., localhost:3000 → localhost)
  const hostnameWithoutPort = hostname.split(':')[0];

  // Check if this is a custom domain (not the main app domain)
  if (MAIN_DOMAIN && hostnameWithoutPort !== MAIN_DOMAIN && hostnameWithoutPort !== 'localhost') {
    // This is likely a custom domain — look up agency branding
    // In production, query the database here:
    //
    // const agency = await db.user.findFirst({
    //   where: { customDomain: hostnameWithoutPort, tier: 'AGENCY' },
    //   select: { brandingColor: true, brandingLogoUrl: true, id: true, name: true },
    // });
    //
    // if (agency) {
    //   url.searchParams.set('brandingColor', agency.brandingColor || '');
    //   url.searchParams.set('brandingLogoUrl', agency.brandingLogoUrl || '');
    //   url.searchParams.set('agencyId', agency.id);
    //   url.searchParams.set('agencyName', agency.name || '');
    // }

    // For now, pass the hostname as a query param for the frontend to use
    url.searchParams.set('customDomain', hostnameWithoutPort);
    url.searchParams.set('isCustomDomain', 'true');

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
