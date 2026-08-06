// ============================================================
// ErrorBoundaryWrapper — Client wrapper for ErrorBoundary
// ============================================================
// Since root layout.tsx is a Server Component, this client
// component wraps children with the ErrorBoundary class component.

'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
