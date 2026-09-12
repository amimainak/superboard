// ============================================================
// /whiteboard — Server Component route
// ============================================================
// Exports metadata for SEO (Task #22) and renders the client
// WhiteboardApp wrapper which keeps the ErrorBoundary + dynamic
// import (ssr:false) pattern. Server components cannot use
// next/dynamic with ssr:false, so the dynamic import lives in
// the adjacent WhiteboardApp.tsx client component.

import type { Metadata } from 'next'
import WhiteboardApp from './WhiteboardApp'

export const metadata: Metadata = {
  title: 'Whiteboard — Superboard',
  description:
    'Open the Superboard whiteboard — an infinite canvas with 120+ interactive instructional widgets across Math, Science, Language Arts, and more.',
}

export default function WhiteboardPage() {
  return <WhiteboardApp />
}
