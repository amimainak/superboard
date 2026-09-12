// ============================================================
// /signup — Server Component route
// ============================================================
// Exports metadata for SEO (Task #22) and renders the client
// SignupForm.

import type { Metadata } from 'next'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Create Account — Superboard',
  description:
    'Create your free Superboard tutor account — no credit card required. Free forever for individual tutors.',
}

export default function SignupPage() {
  return <SignupForm />
}
