// ============================================================
// K-12 AI Superboard — Root Page (Server Component Wrapper)
// ============================================================
// Forces dynamic rendering (no SSG) so the auth gate
// client component hydrates properly on every request.
// ============================================================

import AuthGate from '@/components/auth/AuthGate';

// Force dynamic rendering — prevent SSG pre-rendering that
// bakes authLoading=true into static HTML and breaks Turbopack
// RSC hydration in the browser.
export const dynamic = 'force-dynamic';

export default function RootPage() {
  return <AuthGate />;
}
