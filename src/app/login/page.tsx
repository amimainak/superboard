// ============================================================
// /login — Server Component route
// ============================================================
// Exports metadata for SEO (Task #22) and renders the client
// LoginForm. Server components cannot use hooks (useState,
// useRouter), so the interactive form lives in LoginForm.tsx.

import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — Superboard',
  description:
    'Sign in to your Superboard tutor account to access your saved boards, templates, and student roster.',
}

export default function LoginPage() {
  return <LoginForm />
}
