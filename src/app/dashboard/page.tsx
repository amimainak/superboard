// ============================================================
// /dashboard — Redirects to root (/)
// ============================================================
// The app is an SPA-like auth gate at / that renders either
// the landing page or the dashboard based on auth state.
// This route provides a user-friendly redirect for anyone
// who navigates to /dashboard directly.
// ============================================================

import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/');
}
